$(document).ready(function () {
    function validInput(value) {
        var precision = $('.crypto-amount').data('precision') || 8;
        var re = new RegExp('^\\d{1,15}\.?\\d{0,' + precision + '}$');
        return re.test(value);
    }

    function limitNumberOfChar(ev) {
        var value = ev.target.value || String.fromCharCode(ev.which);
        if (!validInput(value)) {
            ev.returnValue = false;
            ev.preventDefault();
        }
    }

    // for mobile devices, limitNumberOfChart isn't enough
    function checkLength(ev) {
        var value = ev.target.value;
        if (!validInput(value)) {
            value = value.substring(0, value.length - 1);
            ev.target.value = value;
        }
    }

    $('.crypto-amount').on('keypress', function (ev) { limitNumberOfChar(ev) })
        .on('input', function(ev) { checkLength(ev); });

    var displayErrorMessage = function($elm, msg) {
        if (!$elm.siblings('.error-msg').length) {
            $elm.parent().append($('<p/>', { class: 'error-msg' }));
        }
        $elm.siblings('.error-msg').text(msg);
    };

    $('.cr-cashier-form').submit(function (e) {
        var $form   = $(e.target),
            $amount = $form.find('.crypto-amount'),
            amount  = +$amount.val();

        $form.find('.error-msg').remove();

        if (isNaN(amount) || amount < 0) {
         
            e.preventDefault();
            displayErrorMessage($amount, 'Please enter a valid number');
            console.log('error');
            return false;
        }
        return true;
    });
});