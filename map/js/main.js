/**
 * main.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2016, Codrops
 * http://www.codrops.com
 */
;(function(window) {

	'use strict';

	// helper functions
	// from https://davidwalsh.name/vendor-prefix
	var prefix = (function () {
		var styles = window.getComputedStyle(document.documentElement, ''),
			pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1],
			dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
		
		return {
			dom: dom,
			lowercase: pre,
			css: '-' + pre + '-',
			js: pre[0].toUpperCase() + pre.substr(1)
		};
	})();
	
	// vars & stuff
	var support = {transitions : Modernizr.csstransitions},
		transEndEventNames = {'WebkitTransition': 'webkitTransitionEnd', 'MozTransition': 'transitionend', 'OTransition': 'oTransitionEnd', 'msTransition': 'MSTransitionEnd', 'transition': 'transitionend'},
		transEndEventName = transEndEventNames[Modernizr.prefixed('transition')],
		onEndTransition = function(el, callback, propTest) {
			var onEndCallbackFn = function( ev ) {
				if( support.transitions ) {
					if( ev.target != this || propTest && ev.propertyName !== propTest && ev.propertyName !== prefix.css + propTest ) return;
					this.removeEventListener( transEndEventName, onEndCallbackFn );
				}
				if( callback && typeof callback === 'function' ) { callback.call(this); }
			};
			if( support.transitions ) {
				el.addEventListener( transEndEventName, onEndCallbackFn );
			}
			else {
				onEndCallbackFn();
			}
		},
		// the mall element
		mall = document.querySelector('.mall'),
		// mall´s levels wrapper
		mallLevelsEl = mall.querySelector('.levels'),
		// mall´s levels
		mallLevels = [].slice.call(mallLevelsEl.querySelectorAll('.level')),
		// total levels
		mallLevelsTotal = mallLevels.length,
		// surroundings elems
		mallSurroundings = [].slice.call(mall.querySelectorAll('.surroundings')),
		// selected level position
		selectedLevel,
		// navigation element wrapper
		mallNav = document.querySelector('.mallnav'),
		// show all mall´s levels ctrl
		allLevelsCtrl = mallNav.querySelector('.mallnav__button--all-levels'),
		// levels navigation up/down ctrls
		levelUpCtrl = mallNav.querySelector('.mallnav__button--up'),
		levelDownCtrl = mallNav.querySelector('.mallnav__button--down'),
		// pins
		pins = [].slice.call(mallLevelsEl.querySelectorAll('.pin')),
		// content element
		contentEl = document.querySelector('.content'),
		// content close ctrl
		contentCloseCtrl = contentEl.querySelector('button.content__button'),
		// check if a content item is opened
		isOpenContentArea,
		// check if currently animating/navigating
		isNavigating,
		// check if all levels are shown or if one level is shown (expanded)
		isExpanded,
		// spaces list element
		spacesListEl = document.getElementById('spaces-list'),
		// spaces list ul
		spacesEl = spacesListEl.querySelector('ul.list'),
		// all the spaces listed
		spaces = [].slice.call(spacesEl.querySelectorAll('.list__item > a.list__link')),
		// reference to the current shows space (name set in the data-name attr of both the listed spaces and the pins on the map)
		spaceref,
		// sort by ctrls
		sortByNameCtrl = document.querySelector('#sort-by-name'),
		// listjs initiliazation (all mall´s spaces)
		spacesList = new List('spaces-list', { valueNames: ['list__link', { data: ['level'] }, { data: ['category'] } ]} ),

		// smaller screens:
		// open search ctrl
		openSearchCtrl = document.querySelector('button.open-search'),
		// main container
		containerEl = document.querySelector('.container'),
		// close search ctrl
		closeSearchCtrl = spacesListEl.querySelector('button.close-search'),

		backBtn = document.querySelector(".codrops-icon--prev");

	function init() {
		// init/bind events
		initEvents();
	}

	/**
	 * Initialize/Bind events fn.
	 */
	function initEvents() {
		// click on a Mall´s level
		mallLevels.forEach(function(level, pos) {
			level.addEventListener('click', function() {
				// shows this level
				showLevel(pos+1);
			});
		});

		// click on the show mall´s levels ctrl
		allLevelsCtrl.addEventListener('click', function() {
			// shows all levels
			showAllLevels();
		});

		// navigating through the levels
		levelUpCtrl.addEventListener('click', function() { navigate('Down'); });
		levelDownCtrl.addEventListener('click', function() { navigate('Up'); });

		// sort by name ctrl - add/remove category name (css pseudo element) from list and sorts the spaces by name 
		sortByNameCtrl.addEventListener('click', function() {
			if( this.checked ) {
				classie.remove(spacesEl, 'grouped-by-category');
				spacesList.sort('list__link');
			}
			else {
				classie.add(spacesEl, 'grouped-by-category'); 
				spacesList.sort('category');
			}
		});

		// hovering a pin / clicking a pin
		pins.forEach(function(pin) {
			var contentItem = contentEl.querySelector('.content__item[data-space="' + pin.getAttribute('data-space') + '"]');

			pin.addEventListener('mouseenter', function() {
				if( !isOpenContentArea ) {
					classie.add(contentItem, 'content__item--hover');
				}
			});
			pin.addEventListener('mouseleave', function() {
				if( !isOpenContentArea ) {
					classie.remove(contentItem, 'content__item--hover');
				}
			});
			pin.addEventListener('click', function(ev) {
				ev.preventDefault();
				// open content for this pin
				openContent(pin.getAttribute('data-space'));
				// remove hover class (showing the title)
				classie.remove(contentItem, 'content__item--hover');
			});
		});

		// closing the content area
		contentCloseCtrl.addEventListener('click', function() {
			closeContentArea();
		});

		// clicking on a listed space: open level - shows space
		spaces.forEach(function(space) {
			var spaceItem = space.parentNode,
				level = spaceItem.getAttribute('data-level'),
				spacerefval = spaceItem.getAttribute('data-space');

			space.addEventListener('click', function(ev) {
				ev.preventDefault();
				// for smaller screens: close search bar
				closeSearch();
				// open level
				showLevel(level);
				// open content for this space
				openContent(spacerefval);
			});
		});

		// smaller screens: open the search bar
		openSearchCtrl.addEventListener('click', function() {
			openSearch();
		});

		// smaller screens: close the search bar
		closeSearchCtrl.addEventListener('click', function() {
			closeSearch();
		});

		// pins.forEach((pin) => {
		// 	let dataSpace = pin.getAttribute('data-space');
		// 	if (dataSpace === "6.03") {
		// 		pin.setAttribute("data-category", "3");
		// 	}
		// });

		initStatusListener();

		backBtn.addEventListener("click", () => {
			const guestId = sessionStorage.getItem('guestId');
			if (guestId) {
				window.location.href = `../htmls/guest.html?team=${guestId}`;
			}
		});
	}

	function initStatusListener() {
		const map = {
			'13' : '3.01',
			'12' : '3.02',
			'11' : '3.03',
			'22' : '3.04',
			'24' : '3.05',
			'19' : '3.06',
			'8' : '3.07',
			'25' : '4.01',
			'9' : '4.02',
			'18' : '4.03',
			'1' : '4.04',
			'14' : '5.01',
			'5' : '5.02',
			'20' : '5.03',
			'10' : '5.04',
			'7' : '6.01',
			'6' : '6.02',
			'16' : '6.03',
			'3' : '6.04',
			'23' : '7.01',
			'4' : '7.02',
			'21' : '7.03',
			'17' : '8.01',
			'2' : '8.02',
			'15' : '8.03'
		};
	
		db.collection("authentication").doc("gamemaster")
		  .onSnapshot((doc) => {
			if (doc.exists) {
				const accounts = doc.data().accounts;
	
				// Loop through all accounts
				Object.keys(accounts).forEach(accountKey => {
					const acc = accounts[accountKey];
					const id = acc.id;
					const status = acc.status;
	
					// Determine category based on status
					const category = (status === "vacant") ? "2" : "3";
	
					if (map[id]) {
						const mappedSpace = map[id];
	
						updateElements(mappedSpace, category);
					}
				});
			}
		}, (err) => {
			console.error("Error fetching gamemaster doc:", err);
		});
	}
	
	// This function updates DOM elements
	function updateElements(space, category) {
		// Update Pins
		const pinElements = document.querySelectorAll(`.pin[data-space="${space}"]`);
		pinElements.forEach(pin => pin.setAttribute("data-category", category));
	
		// Update List Items
		const listItems = document.querySelectorAll(`.list__item[data-space="${space}"]`);
		listItems.forEach(li => li.setAttribute("data-category", category));
	
		// Update Content Items
		const contentItems = document.querySelectorAll(`.content__item[data-space="${space}"]`);
		contentItems.forEach(ci => ci.setAttribute("data-category", category));

		sortListByCategoryLevelAndSpace();
	
		// Refresh category headers
		document.querySelectorAll('.list__item.is-category-header').forEach(el => el.classList.remove('is-category-header'));
		markCategoryHeaders();
	
		console.log(`Updated elements for space ${space} → category ${category}`);
	}
	
	// Mark the first occurrence of each category
	function markCategoryHeaders() {
		const categoriesFound = new Set();
	
		document.querySelectorAll('.list__item').forEach(item => {
			const cat = item.dataset.category;
	
			if (!categoriesFound.has(cat)) {
				item.classList.add('is-category-header');
				categoriesFound.add(cat);
			}
		});
	}

	function applyDisplayLevelOffset() {
		const LEVEL_OFFSET = 2;
	
		document.querySelectorAll('.list__item').forEach(item => {
			const realLevel = parseInt(item.dataset.level);
			const displayLevel = realLevel + LEVEL_OFFSET;
	
			// Add visual-only display level
			item.dataset.displayLevel = displayLevel;
		});
	}	

	function sortListByCategoryLevelAndSpace() {
		const LEVEL_OFFSET = 2;
		const list = document.querySelector('.list');
	
		// Only sort real list items, no headers
		const items = Array.from(list.querySelectorAll('.list__item[data-category]'));
	
		items.sort((a, b) => {
			const catA = parseInt(a.dataset.category);
			const catB = parseInt(b.dataset.category);
	
			// CATEGORY ALWAYS FIRST PRIORITY
			if (catA !== catB) return catA - catB;
	
			// Same category → compare level
			const levelA = parseInt(a.dataset.level) + LEVEL_OFFSET;
			const levelB = parseInt(b.dataset.level) + LEVEL_OFFSET;
	
			if (levelA !== levelB) return levelA - levelB;
	
			// Same category, same level → NOW compare space
			const spaceA = parseFloat(a.dataset.space);
			const spaceB = parseFloat(b.dataset.space);
	
			if (spaceA !== spaceB) return spaceA - spaceB;
	
			// Final alphabetical fallback
			const nameA = a.querySelector('.list__link').textContent.trim();
			const nameB = b.querySelector('.list__link').textContent.trim();
			return nameA.localeCompare(nameB);
		});
	
		// Reset list and re-append sorted items
		list.innerHTML = "";
		items.forEach(item => list.appendChild(item));
	
		applyDisplayLevelOffset();
		markCategoryHeaders();
	}
	
	

	/**
	 * Opens a level. The current level moves to the center while the other ones move away.
	 */
	function showLevel(level) {
		if( isExpanded ) {
			return false;
		}
		
		// update selected level val
		selectedLevel = level;

		// control navigation controls state
		setNavigationState();

		classie.add(mallLevelsEl, 'levels--selected-' + selectedLevel);
		
		// the level element
		var levelEl = mallLevels[selectedLevel - 1];
		classie.add(levelEl, 'level--current');

		onEndTransition(levelEl, function() {
			classie.add(mallLevelsEl, 'levels--open');

			// show level pins
			showPins();

			isExpanded = true;
		}, 'transform');
		
		// hide surroundings element
		hideSurroundings();
		
		// show mall nav ctrls
		showMallNav();

		// filter the spaces for this level
		showLevelSpaces();

		// FILTERRR
		sortListByCategoryLevelAndSpace();
	
		// refresh category headers
		document.querySelectorAll('.list__item.is-category-header').forEach(el => el.classList.remove('is-category-header'));
		markCategoryHeaders();
	}

	/**
	 * Shows all Mall´s levels
	 */
	function showAllLevels() {
		if( isNavigating || !isExpanded ) {
			return false;
		}
		isExpanded = false;

		classie.remove(mallLevels[selectedLevel - 1], 'level--current');
		classie.remove(mallLevelsEl, 'levels--selected-' + selectedLevel);
		classie.remove(mallLevelsEl, 'levels--open');

		// hide level pins
		removePins();

		// shows surrounding element
		showSurroundings();
		
		// hide mall nav ctrls
		hideMallNav();

		// show back the complete list of spaces
		spacesList.filter();

		// FILTERRR
		sortListByCategoryLevelAndSpace();
	
		// refresh category headers
		document.querySelectorAll('.list__item.is-category-header').forEach(el => el.classList.remove('is-category-header'));
		markCategoryHeaders();

		// close content area if it is open
		if( isOpenContentArea ) {
			closeContentArea();
		}
	}

	/**
	 * Shows all spaces for current level
	 */
	// function showLevelSpaces() {
	// 	spacesList.filter(function(item) { 
	// 		return item.values().level === selectedLevel.toString(); 
	// 	});
	// }

	function showLevelSpaces() {
		// Filter by the selected level
		spacesList.filter(item => item.values().level === selectedLevel.toString());
	
		// Sort filtered items: first by category, then by level
		spacesList.sort((a, b) => {
			const catA = parseInt(a.values().category);
			const catB = parseInt(b.values().category);
			if (catA !== catB) return catA - catB;
	
			const levelA = parseInt(a.values().level);
			const levelB = parseInt(b.values().level);
			return levelA - levelB;
		});
	
		// FILTERRR
		sortListByCategoryLevelAndSpace();
	
		// refresh category headers
		document.querySelectorAll('.list__item.is-category-header').forEach(el => el.classList.remove('is-category-header'));
		markCategoryHeaders();
	}
	

	// function showLevelSpaces() {
	// 	// Filter by current level
	// 	const filteredItems = spacesList.filter(item => item.values().level === selectedLevel.toString());
	
	// 	// Sort filtered items by category first, then by level
	// 	const sortedItems = filteredItems.sort((a, b) => {
	// 		const catA = parseInt(a.el.dataset.category);
	// 		const catB = parseInt(b.el.dataset.category);
	// 		if (catA !== catB) return catA - catB;
	
	// 		const levelA = parseInt(a.el.dataset.level);
	// 		const levelB = parseInt(b.el.dataset.level);
	// 		return levelA - levelB;
	// 	});
	
	// 	// Apply the sorted & filtered items to the list
	// 	spacesList.show(sortedItems.map(item => item.el));
	
	// 	// Refresh category headers
	// 	document.querySelectorAll('.list__item.is-category-header').forEach(el => el.classList.remove('is-category-header'));
	// 	markCategoryHeaders();
	// }
	

	/**
	 * Shows the level´s pins
	 */
	function showPins(levelEl) {
		var levelEl = levelEl || mallLevels[selectedLevel - 1];
		classie.add(levelEl.querySelector('.level__pins'), 'level__pins--active');
	}

	/**
	 * Removes the level´s pins
	 */
	function removePins(levelEl) {
		var levelEl = levelEl || mallLevels[selectedLevel - 1];
		classie.remove(levelEl.querySelector('.level__pins'), 'level__pins--active');
	}

	/**
	 * Show the navigation ctrls
	 */
	function showMallNav() {
		classie.remove(mallNav, 'mallnav--hidden');
	}

	/**
	 * Hide the navigation ctrls
	 */
	function hideMallNav() {
		classie.add(mallNav, 'mallnav--hidden');
	}

	/**
	 * Show the surroundings level
	 */
	function showSurroundings() {
		mallSurroundings.forEach(function(el) {
			classie.remove(el, 'surroundings--hidden');
		});
	}

	/**
	 * Hide the surroundings level
	 */
	function hideSurroundings() {
		mallSurroundings.forEach(function(el) {
			classie.add(el, 'surroundings--hidden');
		});
	}

	/**
	 * Navigate through the mall´s levels
	 */
	function navigate(direction) {
		if( isNavigating || !isExpanded || isOpenContentArea ) {
			return false;
		}
		isNavigating = true;

		var prevSelectedLevel = selectedLevel;

		// current level
		var currentLevel = mallLevels[prevSelectedLevel-1];

		if( direction === 'Up' && prevSelectedLevel > 1 ) {
			--selectedLevel;
		}
		else if( direction === 'Down' && prevSelectedLevel < mallLevelsTotal ) {
			++selectedLevel;
		}
		else {
			isNavigating = false;	
			return false;
		}

		// control navigation controls state (enabled/disabled)
		setNavigationState();
		// transition direction class
		classie.add(currentLevel, 'level--moveOut' + direction);
		// next level element
		var nextLevel = mallLevels[selectedLevel-1]
		// ..becomes the current one
		classie.add(nextLevel, 'level--current');

		// when the transition ends..
		onEndTransition(currentLevel, function() {
			classie.remove(currentLevel, 'level--moveOut' + direction);
			// solves rendering bug for the SVG opacity-fill property
			setTimeout(function() {classie.remove(currentLevel, 'level--current');}, 60);

			classie.remove(mallLevelsEl, 'levels--selected-' + prevSelectedLevel);
			classie.add(mallLevelsEl, 'levels--selected-' + selectedLevel);

			// show the current level´s pins
			showPins();

			isNavigating = false;
		});

		// filter the spaces for this level
		showLevelSpaces();

		// hide the previous level´s pins
		removePins(currentLevel);
	}

	/**
	 * Control navigation ctrls state. Add disable class to the respective ctrl when the current level is either the first or the last.
	 */
	function setNavigationState() {
		if( selectedLevel == 1 ) {
			classie.add(levelDownCtrl, 'boxbutton--disabled');
		}
		else {
			classie.remove(levelDownCtrl, 'boxbutton--disabled');
		}

		if( selectedLevel == mallLevelsTotal ) {
			classie.add(levelUpCtrl, 'boxbutton--disabled');
		}
		else {
			classie.remove(levelUpCtrl, 'boxbutton--disabled');
		}
	}

	/**
	 * Opens/Reveals a content item.
	 */
	function openContent(spacerefval) {
		// if one already shown:
		if( isOpenContentArea ) {
			hideSpace();
			spaceref = spacerefval;
			showSpace();
		}
		else {
			spaceref = spacerefval;
			openContentArea();
		}
		
		// remove class active (if any) from current list item
		var activeItem = spacesEl.querySelector('li.list__item--active');
		if( activeItem ) {
			classie.remove(activeItem, 'list__item--active');
		}
		// list item gets class active (if the list item is currently shown in the list)
		var listItem = spacesEl.querySelector('li[data-space="' + spacerefval + '"]')
		if( listItem ) {
			classie.add(listItem, 'list__item--active');
		}

		// remove class selected (if any) from current space
		var activeSpaceArea = mallLevels[selectedLevel - 1].querySelector('svg > .map__space--selected');
		if( activeSpaceArea ) {
			classie.remove(activeSpaceArea, 'map__space--selected');
		}
		// svg area gets selected
		classie.add(mallLevels[selectedLevel - 1].querySelector('svg > .map__space[data-space="' + spaceref + '"]'), 'map__space--selected');
	}

	/**
	 * Opens the content area.
	 */
	function openContentArea() {
		isOpenContentArea = true;
		// shows space
		showSpace(true);
		// show close ctrl
		classie.remove(contentCloseCtrl, 'content__button--hidden');
		// resize mall area
		classie.add(mall, 'mall--content-open');
		// disable mall nav ctrls
		classie.add(levelDownCtrl, 'boxbutton--disabled');
		classie.add(levelUpCtrl, 'boxbutton--disabled');
	}

	/**
	 * Shows a space.
	 */
	function showSpace(sliding) {
		// the content item
		var contentItem = contentEl.querySelector('.content__item[data-space="' + spaceref + '"]');
		// show content
		classie.add(contentItem, 'content__item--current');
		if( sliding ) {
			onEndTransition(contentItem, function() {
				classie.add(contentEl, 'content--open');
			});
		}
		// map pin gets selected
		classie.add(mallLevelsEl.querySelector('.pin[data-space="' + spaceref + '"]'), 'pin--active');
	}

	/**
	 * Closes the content area.
	 */
	function closeContentArea() {
		classie.remove(contentEl, 'content--open');
		// close current space
		hideSpace();
		// hide close ctrl
		classie.add(contentCloseCtrl, 'content__button--hidden');
		// resize mall area
		classie.remove(mall, 'mall--content-open');
		// enable mall nav ctrls
		if( isExpanded ) {
			setNavigationState();
		}
		isOpenContentArea = false;
	}

	/**
	 * Hides a space.
	 */
	function hideSpace() {
		// the content item
		var contentItem = contentEl.querySelector('.content__item[data-space="' + spaceref + '"]');
		// hide content
		classie.remove(contentItem, 'content__item--current');
		// map pin gets unselected
		classie.remove(mallLevelsEl.querySelector('.pin[data-space="' + spaceref + '"]'), 'pin--active');
		// remove class active (if any) from current list item
		var activeItem = spacesEl.querySelector('li.list__item--active');
		if( activeItem ) {
			classie.remove(activeItem, 'list__item--active');
		}
		// remove class selected (if any) from current space
		var activeSpaceArea = mallLevels[selectedLevel - 1].querySelector('svg > .map__space--selected');
		if( activeSpaceArea ) {
			classie.remove(activeSpaceArea, 'map__space--selected');
		}
	}

	/**
	 * for smaller screens: open search bar
	 */
	function openSearch() {
		// shows all levels - we want to show all the spaces for smaller screens 
		showAllLevels();

		classie.add(spacesListEl, 'spaces-list--open');
		classie.add(containerEl, 'container--overflow');
	}

	/**
	 * for smaller screens: close search bar
	 */
	function closeSearch() {
		classie.remove(spacesListEl, 'spaces-list--open');
		classie.remove(containerEl, 'container--overflow');
	}
	
	init();

})(window);