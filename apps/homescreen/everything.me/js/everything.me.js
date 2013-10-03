'use strict';

var EverythingME = {
  pendingEvent: undefined,

  init: function EverythingME_init() {
    var footer = document.querySelector('#footer');
    if (footer) {
      footer.style.MozTransition = '-moz-transform .3s ease';
    }

    var gridPage = document.querySelector('#icongrid > div:first-child');
    gridPage.classList.add('evmePage');


    // pre-evme-load pseudo searchbar
    var activationIcon = document.createElement('div');
    activationIcon.id = 'evme-activation-icon';
    activationIcon.innerHTML = '<div><input type="text" x-inputmode="verbatim" data-l10n-id="evme-searchbar-default" /></div>';

    // insert into first page
    gridPage.insertBefore(activationIcon, gridPage.firstChild);

    // Append appropriate placeholder translation to pseudo searchbar
    navigator.mozL10n.ready(function loadSearchbarValue() {
      var input = activationIcon.querySelector('input'),
          defaultText = navigator.mozL10n.get('evme-searchbar-default2') || '';

      input.setAttribute('placeholder', defaultText);
    });

    // add event listeners that trigger evme load
    activationIcon.addEventListener('contextmenu', onContextMenu);
    activationIcon.addEventListener('click', triggerActivateFromInput);
    window.addEventListener('collectionlaunch', triggerActivate);
    window.addEventListener('suggestcollections', triggerActivate);

    // specifically for pseudo searchbar
    function triggerActivateFromInput(e) {
      // gives the searchbar evme styling
      document.body.classList.add('evme-loading-from-input');
      triggerActivate(e);
    }

    function triggerActivate(e) {
      // save original invoking event for post-emve-load replay
      EverythingME.pendingEvent = e;

      // remove pre-evme-load listeners
      activationIcon.removeEventListener('click', triggerActivateFromInput);
      activationIcon.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('collectionlaunch', triggerActivate);
      window.removeEventListener('collectiondropapp', triggerActivate);
      window.removeEventListener('suggestcollections', triggerActivate);

      // show the full-screen loading until e.me is really loaded
      if (e.type === 'suggestcollections') {
        EverythingME.showLoading(loadCollectionAssets);
      } else {
        loadCollectionAssets();
      }
    }

    function loadCollectionAssets() {
      var e = EverythingME.pendingEvent;

      // load styles required for Collection styling
      LazyLoader.load([
        document.getElementById('search-page'),
        'shared/style_unstable/progress_activity.css',
        'everything.me/css/common.css',
        'everything.me/modules/Collection/Collection.css'],
        function assetsLoaded() {
          // open the collection immediately
          if (e && e.type === 'collectionlaunch') {
            onCollectionOpened(activationIcon, e.detail.id);
          }

          // Activate evme load
          // But wait a tick, so there's no flash of unstyled progress indicator
          window.setTimeout(EverythingME.activate, 0);
        }
      );
    }

    // show Collection loading
    function onCollectionOpened(activationIcon, id) {
      // add classes for Collection styling
      var appsEl = document.getElementById('icongrid');
      appsEl.classList.add('evme-collection-visible');
      var elCollection = document.getElementById('collection');
      elCollection.classList.add('visible');
      var collection = GridManager.getIconByOrigin(id);
      elCollection.querySelector('.title').innerHTML =
              '<em></em>' +
              '<span class="actual">' + collection.getName() + '</span>' + ' ' +
              '<span> ' +
              navigator.mozL10n.get('evme-collection-title-suffix') +
              '</span>';
      var elLoader = elCollection.querySelector(".loading-more");
      elLoader.classList.add('show');

      // hide the pagination bar
      // need timeout to make it match the normal collections animation timing
      window.setTimeout(PaginationBar.hide, 100);

      // add temporary Collection close listeners
      var closeButton  = elCollection.querySelector('.close');
      closeButton.addEventListener('click', EverythingME.onCollectionClosed);
      window.addEventListener("hashchange", EverythingME.onCollectionClosed);
    }

    function onContextMenu(e) {
      e.stopPropagation();
    }

    gridPage.addEventListener('gridpageshowend', function onPageShow() {
      EvmeFacade.onShow();
    });
    gridPage.addEventListener('gridpagehideend', function onPageHide() {
      EvmeFacade.onHide();
    });

    EverythingME.migrateStorage();
  },

  // remove pre-evme-load changes
  onCollectionClosed: function onCollectionClosed(activationIcon) {
    var appsEl = document.getElementById('icongrid');
    appsEl.classList.remove('evme-collection-visible');

    var elCollection = document.getElementById('collection');
    elCollection.classList.remove('visible');

    EverythingME.pendingEvent = undefined;
  },

  activate: function EverythingME_activate() {
    var searchPage = document.getElementById('search-page');
    LazyLoader.load(searchPage, function loaded() {
      document.body.classList.add('evme-loading');
      navigator.mozL10n.translate(searchPage);
      EverythingME.load();
    });
  },

  load: function EverythingME_load(callback) {
    var CB = !('ontouchstart' in window),
        js_files = [
          'js/Core.js',
          'js/etmmanager.js',

          'config/config.js',
          'js/developer/utils.1.3.js',
          'js/helpers/Utils.js',
          'js/helpers/Storage.js',
          'js/helpers/IconManager.js',
          'js/plugins/Scroll.js',
          'js/api/apiv2.js',
          'js/api/DoATAPI.js',
          'js/helpers/EventHandler.js',
          'js/helpers/Idle.js',
          'shared/js/settings_listener.js',
          'js/plugins/Analytics.js',
          'js/plugins/APIStatsEvents.js',
          'js/Brain.js',
          'modules/BackgroundImage/BackgroundImage.js',
          'modules/Banner/Banner.js',
          'modules/ConnectionMessage/ConnectionMessage.js',
          'modules/Features/Features.js',
          'modules/Helper/Helper.js',
          'modules/Location/Location.js',
          'modules/Results/Result.js',
          'modules/Results/providers/CloudApps.js',
          'modules/Results/providers/InstalledApps.js',
          'modules/Results/providers/MarketApps.js',
          'modules/Results/providers/MarketSearch.js',
          'modules/Results/providers/StaticApps.js',
          'modules/Results/ResultManager.js',
          'modules/Searchbar/Searchbar.js',
          'modules/SearchHistory/SearchHistory.js',
          'modules/Collection/Collection.js'
        ],
        css_files = [
          'shared/style/confirm.css',
          'shared/style/status.css',
          'shared/style/action_menu.css',
          'css/common.css',
          'modules/BackgroundImage/BackgroundImage.css',
          'modules/Banner/Banner.css',
          'modules/ConnectionMessage/ConnectionMessage.css',
          'modules/Helper/Helper.css',
          'modules/Results/Results.css',
          'modules/Searchbar/Searchbar.css'
        ];

    var head = document.head;

    var scriptLoadCount = 0;
    var cssLoadCount = 0;

    function onScriptLoad(event) {
      event.target.removeEventListener('load', onScriptLoad);
      if (++scriptLoadCount == js_files.length) {
        EverythingME.start();
      } else {
        loadScript(js_files[scriptLoadCount]);
      }
    }

    function onCSSLoad(event) {
      event.target.removeEventListener('load', onCSSLoad);
      if (++cssLoadCount === css_files.length) {
        loadScript(js_files[scriptLoadCount]);
      } else {
        loadCSS(css_files[cssLoadCount]);
      }
    }

    function loadCSS(file) {
      var link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = (file.indexOf('shared/') !== -1 ? '' : 'everything.me/') +
                   file + (CB ? '?' + Date.now() : '');
      link.addEventListener('load', onCSSLoad);
      window.setTimeout(function load() {
        head.appendChild(link);
      }, 0);
    }

    function loadScript(file) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = (file.indexOf('shared/') !== -1 ? '' : 'everything.me/') +
                   file + (CB ? '?' + Date.now() : '');
      script.defer = true;
      script.addEventListener('load', onScriptLoad);
      window.setTimeout(function load() {
        head.appendChild(script);
      }, 0);
    }

    loadCSS(css_files[0]);
  },

  start: function EverythingME_start() {
    if (document.readyState === 'complete') {
      EverythingME.initEvme();
    } else {
      window.addEventListener('load', function onload() {
        window.removeEventListener('load', onload);
          EverythingME.initEvme();
      });
    }
  },

  initEvme: function EverythingME_initEvme() {
    Evme.init(EverythingME.onEvmeLoaded);
    EvmeFacade = Evme;
  },

  onEvmeLoaded: function onEvmeLoaded() {
    var page = document.getElementById('evmeContainer'),
        gridPage = document.querySelector('#icongrid > div:first-child'),
        activationIcon = document.getElementById('evme-activation-icon'),
        activationIconInput = activationIcon.querySelector('input'),
        existingQuery = activationIconInput && activationIconInput.value,
        evmeInput = document.getElementById('search-q'),
        closeButton = document.querySelector('#collection .close');

    // add evme into the first grid page
    gridPage.appendChild(page.parentNode.removeChild(page));

    EvmeFacade.onShow();

    var e = EverythingME.pendingEvent;

    if (e && evmeInput && e.target === activationIconInput) {
      // set the query the user entered before loaded
      if (existingQuery) {
        EvmeFacade.searchFromOutside(existingQuery);
      }

      EvmeFacade.Searchbar && EvmeFacade.Searchbar.focus && EvmeFacade.Searchbar.focus();
      evmeInput.setSelectionRange(existingQuery.length, existingQuery.length);
    }

    closeButton.removeEventListener('click', EverythingME.onCollectionClosed);

    window.removeEventListener("hashchange", EverythingME.onCollectionClosed);

    document.body.classList.remove('evme-loading');
    document.body.classList.remove('evme-loading-from-input');

    activationIcon.parentNode.removeChild(activationIcon);

    if (e && e.target) {
      e.target.dispatchEvent(e);
    }

    if (e.type === 'suggestcollections') {
      window.addEventListener('CollectionSuggestLoadingShow', loadingShow);
      window.addEventListener('CollectionSuggestOffline', suggestOffline);
    } else {
      EverythingME.hideLoading();
    }

    function loadingShow() {
      window.removeEventListener('CollectionSuggestLoadingShow', loadingShow);
      window.removeEventListener('CollectionSuggestOffline', suggestOffline);
      EverythingME.hideLoading();
    }
    function suggestOffline() {
      window.removeEventListener('CollectionSuggestLoadingShow', loadingShow);
      window.removeEventListener('CollectionSuggestOffline', suggestOffline);
      EverythingME.hideLoading();
    }
  },

  destroy: function EverythingME_destroy() {
    // Deleting all resources of everything.me from DOM
    var list = document.querySelectorAll('head > [href*="everything.me"]');
    for (var i = 0; i < list.length; i++) {
      var resource = list[i];
      resource.parentNode.removeChild(resource);
    }
  },

  // copy relevant user data from 1.0.1 to 1.1 versions
  migrateStorage: function EverythingME_migrateStorage(onComplete, force) {
    var migrationStorageKey = 'migrated_1.0.1_to_1.1';

    if (!onComplete) {
      onComplete = function() {};
    }

    asyncStorage.getItem(migrationStorageKey, function evmeMigration(value) {
      // this means we already migrated, so everything's a-ok
      if (value === true && !force) {
        onComplete();
        return;
      }

      // first mark as "migrated", so if we have an error we won't keep running this
      asyncStorage.setItem(migrationStorageKey, true);

      // start the migration
      console.log('[EVME migration] migrating from 1.0.1 to 1.1...');

      // these are properties that don't need special attention -
      // simply copy from sync to async, oldKey: newKey
      var AUTOMATIC_KEYS = {
            'userHistory': 'evme-userHistory',
            'localShortcuts': 'evme-localShortcuts',
            'localShortcutsIcons': 'evme-localShortcutsIcons'
          },
          numberOfKeys = Object.keys(AUTOMATIC_KEYS).length,
          numberOfKeysDone = 0;

      for (var key in AUTOMATIC_KEYS) {
        EverythingME.copyStorageToDB(key, AUTOMATIC_KEYS[key], onDataMigrated);
      }

      function onDataMigrated() {
        numberOfKeysDone++;
        if (numberOfKeysDone >= numberOfKeys) {
          console.log('[EVME migration] complete successfully!');
          onComplete();
        }
      }
    });
  },

  copyStorageToDB: function copyStorageToDB(oldKey, newKey, onComplete) {
    if (!onComplete) {
      onComplete = function() {};
    }

    console.log('[EVME migration] [' + oldKey + ']: retrieving...');

    try {
      var oldValue = window.localStorage[oldKey];

      if (!oldValue) {
        console.log('[EVME migration] [' + oldKey + ']: no value');
        onComplete(false);
        return false;
      }

      console.log('[EVME migration] [' + oldKey + '] got value: ' + oldValue);
      oldValue = JSON.parse(oldValue);
      if (!oldValue) {
        console.log('[EVME migration] [' + oldKey + ']: invalid json: ' + window.localStorage[oldKey]);
        deleteOld();
        onComplete(false);
        return false;
      }

      // convert old structure to new
      var newValue = {
        'value': oldValue._v,
        'expires': oldValue._e
      };

      console.log('[EVME migration] [' + oldKey + ':' + newKey + ']: saving: ' + JSON.stringify(newValue));
      asyncStorage.setItem(newKey, newValue, function onsaved() {
        console.log('[EVME migration] [' + oldKey + ':' + newKey + ']: saved, remove old data');
        deleteOld();
        onComplete(true);
      });
    } catch(ex) {
      deleteOld();
      console.warn('[EVME migration] [' + oldKey + ']: error: ' + oldValue + ' (' + ex.message + ')');
      onComplete(false);
      return false;
    }

    function deleteOld() {
      window.localStorage[oldKey] = null;
      delete window.localStorage[oldKey];
    }

    return true;
  },

  // show a full-screen loading indicator for lazy-loaded stuff
  showLoading: function showLoading(callback) {
    var elLoading = document.getElementById('loading-dialog');

    LazyLoader.load([
      'shared/style_unstable/progress_activity.css',
      'shared/style/confirm.css',
      elLoading],
      function assetsLoaded() {
        elLoading.querySelector('button').addEventListener('click', function onCancel(e) {
          e.target.removeEventListener('click', onCancel);
          EverythingME.hideLoading();
          EverythingME.pendingEvent = null;
        });

        navigator.mozL10n.translate(elLoading);

        window.setTimeout(function styleReady() {
          elLoading.style.display = 'block';
          callback && callback();
        }, 0);
      }
    );
  },

  // hide the full-screen loading indicator
  hideLoading: function hideLoading() {
    var elLoading = document.getElementById('loading-dialog');
    if (elLoading) {
      elLoading.parentNode.removeChild(elLoading);
    }
  }
};

var EvmeFacade = {
  onShow: function onShow() {
    return false;
  },
  onHide: function onHide() {
    return false;
  }
};
