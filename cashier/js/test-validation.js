const FloatLabel = (() => {

    const amountField = document.getElementById('amount');
    const addressField = document.getElementById('address');

    //validate addrress
    addressField.addEventListener('keyup', function (event) {
        isValidAddress = addressField.checkValidity();
    
        if ( !isValidAddress ) {
            console.log('invalid address')
            addressField.parentNode.classList.add('error');
        } else {
            console.log('ok')
            addressField.parentNode.classList.remove('error');
        }
    });

    // validate amount
    amountField.addEventListener('keyup', function (event) {
        isValidAmount = amountField.checkValidity();

        if ( !isValidAmount && amountField.value ) {
           console.log('invalid' + ' ' + amountField.value)
           amountField.parentNode.classList.add('error');

        } else if (isNaN(amountField.parnetNodeValue)) {
          console.log("Must input numbers");
          amountField.parentNode.classList.add('error');
          return false;

        } else {
           console.log('ok')
           amountField.parentNode.classList.remove('error');
        }
    });

	// add active class
	const handleFocus = (e) => {
		const target = e.target;
		target.parentNode.classList.add('active');
		target.setAttribute('placeholder', target.getAttribute('data-placeholder'));
	};

	// remove active class
	const handleBlur = (e) => {
        const target = e.target;

		if (!target.value ) {
            target.parentNode.classList.remove('active', 'error');

        } 
		target.removeAttribute('placeholder');
	};

	// register events
	const bindEvents = (element) => {
		const floatField = element.querySelector('input');
		floatField.addEventListener('focus', handleFocus);
		floatField.addEventListener('blur', handleBlur);
	};

	// get DOM elements
	const init = () => {
		const floatContainers = document.querySelectorAll('.float-container');

		floatContainers.forEach((element) => {

			if (element.querySelector('input').value) {
				element.classList.add('active');
			}

			bindEvents(element);
		});
	};

	return {
		init: init
	};
})();

FloatLabel.init();