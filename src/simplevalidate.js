/*!
 * SimpleValidate - A simple form field validator
 * Inspired by ValidateSimple https://github.com/BankSimple/ValidateSimple 
 * written by Ian Collins https://github.com/3n
 *
 * The major difference is this is not dependent of mootools, and relies on jquery
 * 
 * author: Jon Rohan <jon@simplegeo.com>
 * version: 0.0.1
 * 
 */

var SimpleValidate = function(element,options) {
    
    this.timeout = null;
    this.options = $.extend({
        invalidClass:"invalid",
        validatingClass:"validating",
        validClass:"valid",
        errorMessage:"Something is wrong.",
        validatingMessage:"Validating.",
        events:"keyup blur focus",
        noValidateKeys: [37, 38, 39, 40, 27, 91, 18, 16, 20, 17, 9],
        typingDelayMs: 600
    },options);
    
    this.validating = function(element, message) {
        element.parents("form:eq(0)").attr("valid",true);
        element.addClass(this.options.validatingClass).parent("label.textbox").addClass(this.options.validatingClass);
        if (this.options["onValidating"]) {
            this.options["onValidating"].call(element[0],message||this.options["validatingMessage"]);
        }
    };
    
    this.invalid = function(element, message) {
        element.parents("form:eq(0)").attr("valid",false);
        element.attr("valid",false).addClass(this.options.invalidClass).parent("label.textbox").addClass(this.options.invalidClass);
        if (this.options["onInvalid"]) {
            this.options["onInvalid"].call(element[0],message||this.options["errorMessage"]);
        }
    };
    
    this.valid = function(element) {
        element.parents("form:eq(0)").attr("valid",true);
        element.attr("valid",true).addClass(this.options.validClass).parent("label.textbox").addClass(this.options.validClass);
        if(this.options["onValid"]) {
            this.options["onValid"].call(element[0]);
        }
    };
    
    this.init = function(elements,options) {
        
        elements.each(function(){
           var val = $(this).val();
           if(val) {
               $(this).attr("firstval", val);
           }
           $(this).attr("lastval", val);
        });
        
        elements.bind("validating",(function(obj){return function(event, message){
            obj.validating($(this), message);
        }})(this));

        elements.bind("valid",(function(obj){return function(event, message){
            obj.valid($(this), message);
        }})(this));

        elements.bind("invalid",(function(obj){return function(event, message){
            obj.invalid($(this), message);
        }})(this));

        elements.bind(this.options["events"],(function(obj){return function(event){
            
            var val = $(this).val();
            
            // don't run on these keys
            if($.inArray(event.keyCode,obj.options["noValidateKeys"]) > -1) {return;}

            // don't test on focus if there's nothing in there
            if(event.type=="focus"&&!val) {return;}

            // if the value hasn't from page load, shouldn't check
            if(val&&val==$(this).attr("firstval")) {obj.valid($(this));return;}

            // if the value hasn't changed since last check
            if(val==$(this).attr("lastval")) {return;}
            $(this).attr("lastval", val);
            
            // clear current delay
            clearTimeout(obj.timeout)
            
            obj.validating($(this),obj.options["validatingMessage"]);

            // test that shit, at a delay
            obj.timeout = setTimeout(
                (function(input){
                    return function(){
                        SimpleValidate.Validators[input.attr("rule")].test(input);
                    }
                })($(this))
                , obj.options["typingDelayMs"]);

        }})(this));
    };
    this.init(element,this.options);
}

/*
 * Our validator rules
 */
SimpleValidate.Validators = {
    'text': {
        check: function(val){
            return ((val.replace(/\s+/g,"") != null) && (val.replace(/\s+/g,"").length > 0));
        },
        test: function(input){
            if(SimpleValidate.Validators["text"].check(input.val())) {
                input.trigger("valid");
            } else {
                input.trigger("invalid");
            }
        }
    },
    'email': {
        check: function(val){
            return val.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i);
        },
        test: function(input){
            if(SimpleValidate.Validators["email"].check(input.val())) {
                input.trigger("valid");
            } else {
                input.trigger("invalid");
            }
        }
    },
    'username': {
        check: function(val) {
            return val.match(/^[A-Z0-9][A-Z0-9\_]{0,30}$/i);
        },
        test: function(input){
            if(SimpleValidate.Validators["username"].check(input.val())) {
                input.trigger("valid");
            } else {
                input.trigger("invalid");
            }
        }
    },
    'name': {
        check: function(val) {
            return val.match(/^[A-Za-z -'&]+$/);
        },
        test: function(input){
            if(SimpleValidate.Validators["username"].check(input.val())) {
                input.trigger("valid");
            } else {
                input.trigger("invalid");
            }
        }
    },
    'numeric': {
        check: function(val) {
            return val.match(/^-?(?:0$0(?=\d*\.)|[1-9]|0)\d*(\.\d+)?$/);
        },
        test: function(input){
            if(SimpleValidate.Validators["numeric"].check(input.val())) {
                input.trigger("valid");
            } else {
                input.trigger("invalid");
            }
        }
    },
    'phone': {
        test: function(input){
            if(SimpleValidate.Validators["phoneUS"].check(input.val()) ||
               SimpleValidate.Validators["phoneUK"].check(input.val()) ||
               SimpleValidate.Validators["mobileUK"].check(input.val())) {
                input.trigger("valid");
            } else {
                input.trigger("invalid","Phone number invalid.");
            }
        }
    },
    'phoneUS': {
        check: function(val) {
            return val.match(/^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
        },
        test: function(input){
            if(SimpleValidate.Validators["phoneUS"].check(input.val())) {
                input.trigger("valid");
            } else {
                input.trigger("invalid");
            }
        }
    },
    'phoneUK': {
        check: function(val) {
            return val.match(/^(\(?(0|\+44)[1-9]{1}\d{1,4}?\)?\s?\d{3,4}\s?\d{3,4})$/);
        },
        test: function(input){
            if(SimpleValidate.Validators["phoneUK"].check(input.val())) {
                input.trigger("valid");
            } else {
                input.trigger("invalid");
            }
        }
    },
    'mobileUK': {
        check: function(val) {
            return val.match(/^((0|\+44)7(5|6|7|8|9){1}\d{2}\s?\d{6})$/);
        },
        test: function(input){
            if(SimpleValidate.Validators["mobileUK"].check(input.val())) {
                input.trigger("valid");
            } else {
                input.trigger("invalid");
            }
        }
    },
    'creditcard': {
        test: function(input) {
            if(SimpleValidate.Validators["numeric"].check(input.val())) {
                // Visa
                if(input.val().match(/^4[0-9]{12}(?:[0-9]{3})?$/)) {
                    input.trigger("valid");
                
                // MasterCard
                } else if (input.val().match(/^5[1-5][0-9]{14}$/)) {
                    input.trigger("valid");
            
                // American Express
                } else if (input.val().match(/^3[47][0-9]{13}$/)) {
                    input.trigger("valid");
                
                // Diners Club
                } else if (input.val().match(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/)) {
                    input.trigger("invalid","Diners Club cards are not supported.");

                // Discover
                } else if (input.val().match(/^6(?:011|5[0-9]{2})[0-9]{12}$/)) {
                    input.trigger("valid");

                // JCB
                } else if (input.val().match(/^(?:2131|1800|35\d{3})\d{11}$/)) {
                    input.trigger("invalid","JCB Cards are not supported.");

                } else {
                    input.trigger("invalid","Credit Card Invalid.");
                
                }
            } else {
                input.trigger("invalid","No spaces or dashes");
            }
        }
    }
}