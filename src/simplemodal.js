/*!
 * SimpleModal - A simple modal class
 * 
 * author: Jon Rohan <jon@simplegeo.com>
 * version: 0.0.1
 * 
 */

var SimpleModal = function(cnt,options) {
    
    this.options = $.extend({
        shaded:true
    },options);
    
    
    this.modal;
    this.content = cnt;
    
    this.open = function() {
        
        // empty the modal out
        this.modal.find(".modal-content").empty();
        
        //
        this.content.clone().attr("class","").css("display","block").appendTo(this.modal.find(".modal-content"));
        
        if (this.options.shaded) {
            var h = $(document).height();
            $(".modal-shade").show().css("height",(h-50)+"px");
        }
        this.modal.show();
        if(this.modal.find(".modal-content").height()<$(window).height() - 100) {
            this.modal.css("position","fixed");
        }
        if (this.options["onOpen"]) {
            this.options["onOpen"].call(this);
        }
    };
    
    this.close = function() {
        if (this.options.shaded) $(".modal-shade").hide();
        this.modal.hide();
        if (this.options["onClose"]) {
            this.options["onClose"].call(this);
        }
    };
    
    this.init = function(content,options) {
        
        this.modal = $(".modal");
        
        // if we haven't binded the events yet
        if(!this.modal.attr("evented")) {
            
            this.modal.attr("evented",true);
            
            // esc key close event
            $(document).keyup((function(obj){return function(e){
                if(e.keyCode==27) {
                    obj.close();
                }
            }})(this));
            
            this.modal.find(".close-modal").click((function(obj){return function(e){
                obj.close();
                return false;
            }})(this));
            
        }
    };
    
    this.init(this.content,this.options);
}
