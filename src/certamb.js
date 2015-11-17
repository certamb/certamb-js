(function (window, undefined) {

    var Certamb = function (config) {
        if (!(this instanceof Certamb)) {
            return new Certamb(config);
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

        sc.loadTrabajador = function() {
            var url = getServerUrl() + '/session/account/trabajador';
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.setRequestHeader('Accept', 'application/json');
            req.setRequestHeader('Authorization', 'bearer ' + sc.authenticatedToken);

            var promise = createPromise();

            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        sc.trabajador = JSON.parse(req.responseText);
                        sc.trabajadorLoaded = true;
                        promise.setSuccess(sc.trabajador);
                    } else if (req.status == 204) {
                        sc.trabajador = undefined;
                        sc.trabajadorLoaded = true;
                        promise.setSuccess(sc.trabajador);
                    } else {
                        promise.setError();
                    }
                }
            };

            req.send();

            return promise.promise;
        };

        sc.loadDireccionRegional = function() {
            var url = getServerUrl() + '/session/account/direccionRegional';
            var req = new XMLHttpRequest();
            req.open('GET', url, true);
            req.setRequestHeader('Accept', 'application/json');
            req.setRequestHeader('Authorization', 'bearer ' + sc.authenticatedToken);

            var promise = createPromise();

            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        sc.direccionRegional = JSON.parse(req.responseText);
                        sc.direccionRegionalLoaded = true;
                        promise.setSuccess(sc.direccionRegional);
                    } else if (req.status == 204) {
                        sc.direccionRegional = undefined;
                        sc.direccionRegionalLoaded = true;
                        promise.setSuccess(sc.direccionRegional);
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
                configUrl = 'certamb.json';
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
                        if (scripts[i].src.match(/.*certamb\.js/)) {
                            config.url = scripts[i].src.substr(0, scripts[i].src.indexOf('/js/certamb.js'));
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

                        //load Direccion regional
                        sc.loadDireccionRegional().success(function () {
                            if(sc.trabajadorLoaded && sc.direccionRegionalLoaded) {
                                promise.setSuccess();
                            }
                        }).error(function () {
                            promise.setError();
                        });

                        //load Trabajador
                        sc.loadTrabajador().success(function () {
                            if(sc.trabajadorLoaded && sc.direccionRegionalLoaded) {
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
        module.exports = Certamb;
    } else {
        window.Sistcoop = Certamb;

        if (typeof define === "function" && define.amd) {
            define("certamb", [], function () {
                return Certamb;
            });
        }
    }
})(window);
