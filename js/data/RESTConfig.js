define(
  function () {
    const restConfig = {
      subPath: '/utj/api2/v2',

      admin: {
        subPath: '/admin',

        strategic: {
          subPath: '/strategic',
          endPath: '/strategic',

          items: {
            endPath: '/items'
          },
          types: {
            endPath: '/types'
          }
        },
        indicators: {
          subPath: '/indicators',
          endPath: '/indicators',

          clone: {
            endPath: '/clone'
          },
          positions: {
            endPath: '/positions'
          },
          periodicities: {
            endPath: '/periodicities'
          },
          types: {
            endPath: '/types'
          },
          status: {
            endPath: '/status'
          },
          pide: {
            endPath: '/pide'
          }
        },
        pe: {
          subPath: '/pe',
          endPath: '/pe',

          types: {
            endPath: '/types'
          }
        }
      },
      catalogs: {
        subPath: '/catalogs',

        unitTypes: {
          endPath: '/unitTypes'
        }
      },
      indicators: {
        subPath: '/indicators',

        pide: {
          subPath: '/pide',
          endPath: '/pide',

          active: {
            endPath: '/active'
          },
          tree: {
            endPath: '/tree'
          }
        },
        mecasut: {
          subPath: '/mecasut',
          endPath: '/mecasut',

          active: {
            endPath: '/active'
          },
          tree: {
            endPath: '/tree'
          }
        },
        pe: {
          subPath: '/pe',

          active: {
            endPath: 'active'
          },
          tree: {
            endPath: '/tree'
          }
        }
      },
      security: {
        subPath: '/security',
        
        profile: {
          endPath: '/profile'
        },
        authorize: {
          endPath: '/authorize'
        }
      }
    };

    function init() {
      recursiveBuildPath(restConfig, '');
    }

    function recursiveBuildPath(object, subPath) {
      if (object) {
        var objectSubPath = object['subPath'];

        if (objectSubPath) {
          var path = subPath + objectSubPath;

          for (var property in object) {
            if (property !== 'subPath') {
              recursiveBuildPath(object[property], path);
            }
          }
        }

        if (object['endPath']) {
          object['path'] = subPath + object['endPath'];
        }
      }
    }

    init();

    return restConfig;
  }
);