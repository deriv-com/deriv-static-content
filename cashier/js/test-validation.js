function validInput(value, p = 8) {
	var re = new RegExp('^\\d{1,15}\.?\\d{0,' + p + '}$');
	return re.test(value);
}

const errors = [];
const FloatLabel = (() => {
	const amountField = document.getElementById('amount');
	const addressField = document.getElementById('address');
	const addressError = document.getElementById('address-error');
	const amountError = document.getElementById('amount-error');
    const precision = document.querySelector('input[name=amount]').getAttribute('data-precision');

	//validate addrress
	addressField.addEventListener('keyup', function (event) {
		isValidAddress = addressField.checkValidity();
		if (!isValidAddress) {
			console.log('invalid address')
			addressField.parentNode.classList.add('error');
			addressError.classList.add('show-error');
			errors.indexOf('address') === -1 && errors.push('address');
		} else {
			console.log('ok')
			addressField.parentNode.classList.remove('error');
			addressError.classList.remove('show-error');
			const has_address_error = errors.indexOf('address');
			if (has_address_error >= 0) {
				errors.splice(has_address_error, 1);
			}
		}
    });

	// validate amount
	amountField.addEventListener('keyup', function (event) {
		isValidAmount = amountField.checkValidity() && validInput(amountField.value, precision);
		console.log(isValidAmount);
		if (!isValidAmount && amountField.value) {
			console.log('invalid' + ' ' + amountField.value)
			amountField.parentNode.classList.add('error');
			amountError.classList.add('show-error');
			errors.indexOf('amount') === -1 && errors.push('amount');
		} else {
			console.log('ok')
			amountField.parentNode.classList.remove('error');
			amountError.classList.remove('show-error');
			const has_amount_error = errors.indexOf('amount');
			if (has_amount_error >= 0) {
				errors.splice(has_amount_error, 1);
			}
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
		if (!target.value) {
			target.parentNode.classList.remove('active', 'error');
			addressError.classList.remove('show-error');
			amountError.classList.remove('show-error');
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

		const form = document.querySelector('form');
		// Disable Input button if there is any error
		const submitButton = document.querySelector('input[type=submit]')
		document.querySelectorAll('input')
			.forEach(function (element) {
				element.addEventListener('blur', function () {
					if (errors.length > 0) {
						submitButton.setAttribute('disabled', 'disabled');
					} else {
						submitButton.removeAttribute('disabled');
					}
				});
			});
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			if (errors.length > 0) {
				console.log('there are input errors');
			} else {
				form.submit();
			}
		})
    };

	return {
		init: init
	};
})();

FloatLabel.init();
