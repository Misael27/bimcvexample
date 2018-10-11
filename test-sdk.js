document.addEventListener("DOMContentLoaded", function(event) {
	BC.init(onLoginResponse);
});

onLoginResponse = function (rsp) {
	if(!rsp.success) {
    alert("Error in BimCV, user not authenticated");
  }
	else {
	    /*session token*/
		console.log("BimCurriculum Token is "+rsp.bimToken); //with this token you can call the BC api with the sdk or with rest services
		document.getElementById("token-test").value = rsp.bimToken;
		/*call api from sdk:*/
	    BC.api.getUserInfo( rsp.bimToken )
	    .then(function success ( rsp ) {
				console.log(JSON.stringify(rsp));
				if ( rsp.success ) {
					document.getElementById("user-email").innerHTML = rsp.user.email;
					document.getElementById("user-name").innerHTML = rsp.user.name;
					document.getElementById("user-lastname").innerHTML = rsp.user.lastName;
					document.getElementById("profile-image").setAttribute("src", rsp.user.profileImage);
				}
			}, function errorHandler (err) {
				console.log("Error in call bc-sdk");
			});
    }
}
