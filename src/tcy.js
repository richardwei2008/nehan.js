var Tcy = (function(){
  /**
     @memberof Nehan
     @class Tcy
     @classdesc abstraction of tcy(tate-chu-yoko) character.
     @constructor
     @param tcy {String}
  */
  function Tcy(tcy){
    this.data = tcy;
    this._type = "tcy";
  }

  Tcy.prototype = {
    /**
       @memberof Nehan.Tcy
       @return {string}
     */
    getData : function(){
      return this.data;
    },
    /**
       @memberof Nehan.Tcy
       @return {int}
    */
    getCharCount : function(){
      return 1;
    },
    /**
       @memberof Nehan.Tcy
       @return {int}
    */
    getAdvance : function(flow, letter_spacing){
      return this.bodySize + letter_spacing;
    },
    /**
       @memberof Nehan.Char
       @return {Object}
    */
    getCssVert : function(line){
      var css = {};
      css["text-align"] = "center";
      if(this.data.length >= 2){
	css["width"] = "1.2em"; // a little wider
      }
      return css;
    },
    /**
       @memberof Nehan.Char
       @return {Object}
    */
    getCssHori : function(line){
      var css = {};
      if(this.data.length === 1){
	css["margin-left"] = "0.25em";
      }
      return css;
    },
    /**
       @memberof Nehan.Tcy
       @return {boolean}
    */
    hasMetrics : function(){
      return (typeof this.bodySize != "undefined");
    },
    /**
       @memberof Nehan.Tcy
       @param flow {Nehan.BoxFlow}
       @param font {Nehan.Font}
    */
    setMetrics : function(flow, font){
      if(flow.isTextVertical()){
	this.bodySize = font.size;
      } else {
	this.bodySize = (this.data.length <= 1)? font.size : Math.floor(1.2 * font.size);
      }
    }
  };

  return Tcy;
})();

