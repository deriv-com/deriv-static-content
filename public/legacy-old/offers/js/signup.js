function validForm()
{
	var email = document.getElementById('EMAIL_FIELD').value;
	var err_div = document.getElementById('errDiv');
 	var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
 	
 	if (reg.test(email)){ 		
 		err_div.setAttribute('class','errDivHidden');
 		return true; 
 	}
 	else{ 		
 		err_div.innerHTML = 'Please enter a valid email address';
 		err_div.setAttribute('class','errDivVisible');
 		return false;
 	}
} 
