/**
* BimCurriculum SDK js
* By Misael Polidor
**/
function BimCV () {
	//attributes:
	this.success = false;
	this.loginButton = "";
	this.connectionUrl = "";
	this.socketStatus = "";
	this.socket = "";
	this.loginWindow = "";
	this.baseUrl = "https://bimcurriculum.herokuapp.com"; /*"http://localhost:62918"*/
	this.socketID = "";
	this.WebSocketStatus = {
		OPEN: 1,
		CLOSING: 2,
		CLOSED : 3
	};
	//bimCV methods:
	this.init = function( idRefExternalComponent ) {
		var withButton = true;
		if (!idRefExternalComponent) { //for default button
			this.loginButton = document.getElementById("bc-login");//          
			if (this.loginButton) {
				this.loginButton.innerHTML = "<button type='button'><img src='"+this.baseUrl+"/assets/images/icono-blanco.png' style='float:left;margin-right:0.5em;height: auto;max-height: 29px;'/><span style='font-weight: 800;'>Login</span> with <span style='font-weight: 800;'>BIM</span>CV</button>"
				this.initButtonDefaultStyle();
				
				
			}
			else {
				withButton = false;
			}
		}
		else {
			this.loginButton = document.getElementById(idRefExternalComponent);
		}
		if (withButton) { //login with button
			this.loginButton.onclick = this.doLoginBC;
			this.connectionUrl = this.convertUrlWS(this.baseUrl) +"/ws";
			this.socketStatus = 0; //0 not connect, 1 connect, 2 connecting
		}
		else {
			this.connectionUrl = this.convertUrlWS(this.baseUrl) +"/ws";
			this.socketStatus = 0; //0 not connect, 1 connect, 2 connecting
		}
	};
	this.convertUrlWS = function (baseUrl) {
		var protocol = baseUrl.substr(0,baseUrl.search(":"));
		var scheme = protocol == "https" ? "wss" : "ws";
		return scheme + baseUrl.substr(baseUrl.search(":")); 
	};
	this.initButtonDefaultStyle = function () {
		var css = "";
		css += '#bc-login { position: relative; }'
		css += '#bc-login button { background: #1ABDFE; background-image: -webkit-linear-gradient(top, #1ABDFE, #008DFF); background-image: -moz-linear-gradient(top, #1ABDFE, #008DFF); background-image: -ms-linear-gradient(top, #1ABDFE, #008DFF); background-image: -o-linear-gradient(top, #1ABDFE, #008DFF); background-image: linear-gradient(to bottom, #1ABDFE, #008DFF); -webkit-border-radius: 6; -moz-border-radius: 6; border-radius: 8px; font-family: Arial; color: #ffffff; font-size: 20px; padding: 10px 20px 10px 20px; text-decoration: none; border: 0px; }';
		css += '#bc-login button:hover { background: #3cb0fd; background-image: -webkit-linear-gradient(top, #3cb0fd, #3498db); background-image: -moz-linear-gradient(top, #3cb0fd, #3498db); background-image: -ms-linear-gradient(top, #3cb0fd, #3498db); background-image: -o-linear-gradient(top, #3cb0fd, #3498db); background-image: linear-gradient(to bottom, #3cb0fd, #3498db); text-decoration: none; }';
		css += '#bc-login:disabled { cursor: not-allowed;}'
		var style = document.createElement('style');
		if (style.styleSheet) {
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}
		document.getElementsByTagName('head')[0].appendChild(style);
	}
	this.doLoginBC = function  () {
		BC.bimCV.connect(); //open socket
	};
	this.openLoginPage = function () {
		var title = this.loginButton && this.loginButton.getAttribute("data-title")!=null ? '&appTitle='+this.loginButton.getAttribute("data-title") : "";
		this.loginWindow = this.PopupCenter(this.baseUrl+'/login-ext?&socket_id='+this.socketID+title,'My BimCurriculum','950','620'); //'900','500'
		if (!!this.loginWindow) {
			var instance = this;
			var timer = setInterval(function() { 
				if(instance.loginWindow.closed) {
					clearInterval(timer);
					if(instance.loginButton) instance.loginButton.disabled = false;
					instance.closeConnection();
					if (!instance.success) {
						if (BC.onLoginResponse.onLoginBimcv) {
							BC.onLoginResponse.onLoginBimcv({success:false, error:'close_window'});
						}
						else {
							BC.onLoginResponse({success:false, error:'close_window'});
						}
					}
					else {
						instance.success = false;
					}
					return null;
				}
			}, 1000);
		}
		else { //ERROR: block window for browser
			console.log("ventana emergente bloqueada");
			alert('Please disable the pop-up blocker and try again.');
			if(this.loginButton) this.loginButton.disabled = false;
			this.closeConnection();
			if (!this.success) {
				if (BC.onLoginResponse.onLoginBimcv) {
					BC.onLoginResponse.onLoginBimcv({success:false, error:'block_window'});
				}
				else {
					BC.onLoginResponse({success:false, error:'block_window'});
				}
			}
		}
	};
	this.socketResponse = function ( rsp ) {
		var isSocketId = rsp.split("-").length == 5;
		if (!this.socketID && isSocketId) {
			this.socketID = rsp;
			this.openLoginPage();
		}
		else if(!isSocketId) {
			this.success = true;
			if(!!this.loginWindow)
				this.loginWindow.close();
			this.closeConnection();
			if (BC.onLoginResponse.onLoginBimcv) {
				BC.onLoginResponse.onLoginBimcv({success:true,bimToken:rsp});
			}
			else {
				BC.onLoginResponse({success:true,bimToken:rsp});
				
			}
		}
	};
	this.connect = function () {
		if ( this.socketStatus == 0 ) {
			this.socketStatus = 2;
			this.socket = new WebSocket(this.connectionUrl);
			this.socket.onopen = function (event) {
				BC.bimCV.updateState();
			};
			this.socket.onclose = function (event) {
				BC.bimCV.updateState();
			};
			this.socket.onerror = BC.bimCV.updateState;
			this.socket.onmessage = function (event) {
				BC.bimCV.socketResponse(event.data);
			};
		}
	};
	this.closeConnection = function () {
		if (!this.socket || this.socket.readyState != this.WebSocketStatus.OPEN) {
			console.log("socket no connect");
		}
		else {
			this.socket.close(1000, "Closing from client");
		}
		this.socketID = null;
	};
	this.updateState = function () {
		var instance = BC.bimCV;
		if (!instance.socket) {
			instance.socketStatus = 0;
		} else {
			switch (instance.socket.readyState) {
				case instance.WebSocketStatus.CLOSED:
					if (instance.socketStatus == 2) {
						alert("Error al intentar conectar con MyBimCurriculum");
						console.log("error socket");
					}
					instance.socketStatus = 0;
					if(instance.loginButton) instance.loginButton.disabled = false;
					if(!!instance.loginWindow)
						instance.loginWindow.close();
					break;
				case instance.WebSocketStatus.CLOSING:
					break;
				case instance.WebSocketStatus.CONNECTING:
					instance.socketStatus = 2;
					if(instance.loginButton) instance.loginButton.disabled = true;
					break;
				case instance.WebSocketStatus.OPEN:
					instance.socketStatus = 1;
					if(instance.loginButton) instance.loginButton.disabled = true;
					break;
				default: //ERROR
					console.log("Error en status de socket");
					instance.socketStatus = 0;
					console.log("error socket");
					if(!!instance.loginWindow)
						instance.loginWindow.close();
					if(instance.loginButton) instance.loginButton.disabled = false;
					break;
			}
		}
	};
	this.PopupCenter = function(url, title, w, h) {
		var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : window.screenX;
		var dualScreenTop = window.screenTop != undefined ? window.screenTop : window.screenY;

		var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
		var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

		var left = ((width / 2) - (w / 2)) + dualScreenLeft;
		var top = ((height / 2) - (h / 2)) + dualScreenTop;
		var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
		if (newWindow && window.focus) {
			newWindow.focus();
		}
		return newWindow;
	};
	this.makeAjaxCall =  function(endpoint, methodType, params={}, headers = {}) {
		var promiseObj = new Promise(function(resolve, reject){
		var xhr = new XMLHttpRequest();
		url = BC.bimCV.baseUrl+endpoint;
		xhr.open(methodType, url, true);
		if (JSON.stringify(params) != "{}") {
			if (methodType.toUpperCase() == "POST") 
				xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			url += "?";
			var idx = 0;
			for(var prop in params) {
				url += (idx++==0) ? (prop+"="+params[prop]) : ("&"+prop+"="+params[prop]);
			}
		}
		if (JSON.stringify(headers) != "{}") {
			for(var prop in headers) {
				xhr.setRequestHeader(prop, headers[prop]);
			}
		}
		xhr.send();
		xhr.onreadystatechange = function(){
			if (xhr.readyState === 4){
				if (xhr.status === 200){
					console.log("xhr done successfully");
					var resp = xhr.responseText;
					var respJson = {};
					try {
						respJson = JSON.parse(resp);
					}
					catch (err) {
						
					}
					resolve(respJson);
				} else {
					reject(xhr.status);
					console.log("xhr failed");
				}
			} else {
				console.log("xhr processing going on");
			}
		}
		console.log("request sent succesfully");
		});
		return promiseObj;
	};
}

function BimCVapi (bimCV) {
	//init
	this.bimCV = bimCV;
	this.init = function(_onLoginResponse) {
		if (_onLoginResponse && (typeof(_onLoginResponse) == "function" ||  typeof(_onLoginResponse) == "object" && _onLoginResponse.onLoginBimcv) ) {
			this.onLoginResponse = _onLoginResponse;
		}
		this.bimCV.init();
	}
	//api:
	this.api = {
		getUserInfo : function (token) {
			if (!!token) {
				return BC.bimCV.makeAjaxCall("/api/account/userinfo", "GET", {}, {Authorization:"bearer " +token})
			}
			else {
				return new Promise(function(resolve, reject){
					reject("ERROR::INVALID TOKEN");
				});
			}
		}
		//add here more call to api bimCV
	};
}	

BC = new BimCVapi(new BimCV());








