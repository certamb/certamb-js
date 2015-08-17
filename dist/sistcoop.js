(function (window, undefined) {

    var Sistcoop = function (config) {
        if (!(this instanceof Sistcoop)) {
            return new Sistcoop(config);
        }

        var sc = this;
        var adapter;

        sc.init = function (initOptions) {

            if (window.Cordova) {
                adapter = loadAdapter('cordova');
            } else {
                adapter = loadAdapter();
            }

            var promise = createPromise();

            var initPromise = createPromise();
            initPromise.promise.success(function () {
                promise.setSuccess();
            }).error(function () {
                promise.setError();
            });

            var configPromise = loadConfig(config);

            function onLoad() {
                var doLogin = function (prompt) {
                    if (!prompt) {
                        options.prompt = 'none';
                    }
                    sc.login(options).success(function () {
                        initPromise.setSuccess();
                    }).error(function () {
                        initPromise.setError();
                    });
                };

                var options = {};
                switch (initOptions.onLoad) {
                    case 'login-required':
                        doLogin(true);
                        break;
                    default:
                        throw 'Invalid value for onLoad';
                }
            }

            configPromise.success(onLoad);
            configPromise.error(function () {
                promise.setError();
            });

            return promise.promise;
        };

        sc.login = function (options) {
            return adapter.login(options);
        };

        sc.loadSucursal = function() {
            var url = getServerUrl() + '/rest/session/account/sucursal';
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.setRequestHeader('Accept', 'application/json');
            req.setRequestHeader('Authorization', 'bearer ' + sc.authenticatedToken);

            var promise = createPromise();

            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        sc.sucursal = JSON.parse(req.responseText);
                        promise.setSuccess(sc.sucursal);
                    } else {
                        promise.setError();
                    }
                }
            };

            req.send();

            return promise.promise;
        };

        sc.loadAgencia = function() {
            var url = getServerUrl() + '/rest/session/account/agencia';
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.setRequestHeader('Accept', 'application/json');
            req.setRequestHeader('Authorization', 'bearer ' + sc.authenticatedToken);

            var promise = createPromise();

            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        sc.agencia = JSON.parse(req.responseText);
                        promise.setSuccess(sc.agencia);
                    } else {
                        promise.setError();
                    }
                }
            };

            req.send();

            return promise.promise;
        };

        sc.loadTrabajador = function() {
            var url = getServerUrl() + '/rest/session/account/trabajador';
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.setRequestHeader('Accept', 'application/json');
            req.setRequestHeader('Authorization', 'bearer ' + sc.authenticatedToken);

            var promise = createPromise();

            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        sc.trabajador = JSON.parse(req.responseText);
                        promise.setSuccess(sc.trabajador);
                    } else {
                        promise.setError();
                    }
                }
            };

            req.send();

            return promise.promise;
        };

        function getServerUrl() {
            return sc.authServerUrl;
        }

        function getAuthenticatedToken() {
            return sc.authenticatedToken;
        }

        function loadConfig(url) {
            var promise = createPromise();
            var configUrl;

            if (!config) {
                configUrl = 'sistcoop.json';
            } else if (typeof config === 'string') {
                configUrl = config;
            }

            if (configUrl) {
                var req = new XMLHttpRequest();
                req.open('GET', configUrl, true);
                req.setRequestHeader('Accept', 'application/json');

                req.onreadystatechange = function () {
                    if (req.readyState == 4) {
                        if (req.status == 200) {
                            var config = JSON.parse(req.responseText);

                            sc.authServerUrl = config['auth-server-url'];
                            sc.authenticatedToken = config['authenticatedToken'];

                            promise.setSuccess();
                        } else {
                            promise.setError();
                        }
                    }
                };

                req.send();
            } else {
                if (!config['url']) {
                    var scripts = document.getElementsByTagName('script');
                    for (var i = 0; i < scripts.length; i++) {
                        if (scripts[i].src.match(/.*sistcoop\.js/)) {
                            config.url = scripts[i].src.substr(0, scripts[i].src.indexOf('/js/sistcoop.js'));
                            break;
                        }
                    }
                }

                if (!config.authenticatedToken) {
                    throw 'authenticatedToken missing';
                }

                sc.authServerUrl = config.url;
                sc.authenticatedToken = config.authenticatedToken;

                promise.setSuccess();
            }

            return promise.promise;
        }

        function createPromise() {
            var p = {
                setSuccess: function (result) {
                    p.success = true;
                    p.result = result;
                    if (p.successCallback) {
                        p.successCallback(result);
                    }
                },

                setError: function (result) {
                    p.error = true;
                    p.result = result;
                    if (p.errorCallback) {
                        p.errorCallback(result);
                    }
                },

                promise: {
                    success: function (callback) {
                        if (p.success) {
                            callback(p.result);
                        } else if (!p.error) {
                            p.successCallback = callback;
                        }
                        return p.promise;
                    },
                    error: function (callback) {
                        if (p.error) {
                            callback(p.result);
                        } else if (!p.success) {
                            p.errorCallback = callback;
                        }
                        return p.promise;
                    }
                }
            };
            return p;
        }

        function loadAdapter(type) {
            if (!type || type == 'default') {
                return {
                    login: function (options) {
                        var promise = createPromise();

                        //load Sucursal
                        sc.loadSucursal().success(function () {
                            if(sc.sucursal && sc.agencia && sc.trabajador) {
                                promise.setSuccess();
                            }
                        }).error(function () {
                            promise.setError();
                        });

                        //load Agencia
                        sc.loadAgencia().success(function () {
                            if(sc.sucursal && sc.agencia && sc.trabajador) {
                                promise.setSuccess();
                            }
                        }).error(function () {
                            promise.setError();
                        });

                        //load Trabajador
                        sc.loadTrabajador().success(function () {
                            if(sc.sucursal && sc.agencia && sc.trabajador) {
                                promise.setSuccess();
                            }
                        }).error(function () {
                            promise.setError();
                        });

                        return promise.promise;
                    }
                };
            }

            throw 'invalid adapter type: ' + type;
        }
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = Sistcoop;
    } else {
        window.Sistcoop = Sistcoop;

        if (typeof define === "function" && define.amd) {
            define("sistcoop", [], function () {
                return Sistcoop;
            });
        }
    }
})(window);
