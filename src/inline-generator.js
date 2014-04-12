var InlineGenerator = (function(){
  function InlineGenerator(style, stream){
    LayoutGenerator.call(this, style, stream);
  }
  Class.extend(InlineGenerator, LayoutGenerator);

  InlineGenerator.prototype._yield = function(context){
    if(!context.isInlineSpaceLeft()){
      return null;
    }
    while(true){
      var element = this._getNext(context);
      if(element === null){
	break;
      }
      var measure = this._getMeasure(element);
      if(!context.hasInlineSpaceFor(measure)){
	this.pushCache(element);
	break;
      }
      this._addElement(context, element, measure);
      if(!context.isInlineSpaceLeft()){
	break;
      }
    }
    // no br, no element
    if(context.isInlineEmpty()){
      return null;
    }
    // justify if this line is generated by overflow(not line-break).
    if(!context.hasBr()){
      this._justifyLine(context);
    }
    return this._createLine(context);
  };

  InlineGenerator.prototype._createChildContext = function(context){
    return new LayoutContext(
      context.block, // inline generator inherits block context as it is.
      new InlineContext(context.getInlineRestMeasure())
    );
  };

  InlineGenerator.prototype._createLine = function(context){
    var measure = this.style.isRootLine()? this.style.getContentMeasure() : context.getInlineCurMeasure();
    return this.style.createLine({
      br:context.hasBr(), // is line broken by br?
      measure:measure, // wrapping measure
      inlineMeasure:context.getInlineCurMeasure(), // actual measure
      elements:context.getInlineElements(), // all inline-child, not only text, but recursive child box.
      texts:context.getInlineTexts(), // elements but text element only.
      charCount:context.getInlineCharCount()
    });
  };

  InlineGenerator.prototype._justifyLine = function(context){
    var next_head = this.peekLastCache(); // by stream.getToken(), stream pos has been moved to next pos already, so cur pos is the next head.
    var new_tail = context.justify(next_head); // if justify is occured, new_tail token is gained.
    if(new_tail){
      this.stream.setPos(new_tail.pos + 1); // new stream pos is next pos of new tail.
      this.clearCache(); // stream position changed, so disable cache.
    }
  };

  InlineGenerator.prototype._getNext = function(context){
    if(this.hasCache()){
      return this.popCache(context);
    }

    if(this.hasChildLayout()){
      return this.yieldChildLayout();
    }

    // read next token
    var token = this.stream.get();
    if(token === null){
      return null;
    }

    // if tag token, inherit style
    var style = this.style;
    if(token instanceof Tag){
      style = new StyleContext(token, this.style);

      // inline -> block, force terminate inline
      if(style.isBlock()){
	this.stream.prev();
	this.setTerminate(true);

	// add line-break to avoid empty-line.
	// because empty-line is returned as null to parent block generator,
	// and it causes page-break of parent block generator.
	context.setLineBreak(true);
	return null;
      }

      // inline image
      if(style.getMarkupName() === "img"){
	return style.createImage();
      }
    }

    // inline text
    if(Token.isText(token)){
      // if tcy, wrap all content and return Tcy object and force generator terminate.
      if(this.style.getTextCombine() === "horizontal"){
	var tcy = new Tcy(this.style.getMarkupContent());
	return this._getText(context, tcy);
      }
      return this._getText(context, token);
    }

    // inline tag(child inline)
    switch(token.getName()){
    case "br":
      context.setLineBreak(true);
      return null;

    default:
      this.setChildLayout(new InlineGenerator(style, this._createStream(style, token)));
      return this.yieldChildLayout(context);
    }
  };

  InlineGenerator.prototype._getText = function(context, token){
    // new-line
    if(token instanceof Char && token.isNewLineChar()){
      if(this.style.isPre()){
	return null; // break line at new-line char.
      }
    }
    if(!token.hasMetrics()){
      // if charactor token, set kerning before setting metrics.
      // because some additional space is added to it in some case.
      if(token instanceof Char){
	this._setCharKerning(context, token);
      }
      token.setMetrics(this.style.flow, this.style.font);
    }
    if(token instanceof Ruby){
      return token;
    }
    switch(token._type){
    case "char":
    case "tcy":
      return token;
      case "word":
      return this._getWord(context, token);
    }
  };

  InlineGenerator.prototype._setCharKerning = function(context, char_token){
    var next_token = this.stream.peek();
    var prev_text = context.getInlineLastText();
    var next_text = next_token && Token.isText(next_token)? next_token : null;
    Kerning.set(char_token, prev_text, next_text);
  };

  InlineGenerator.prototype._getWord = function(context, token){
    var rest_measure = context.getInlineRestMeasure();
    var advance = token.getAdvance(this.style.flow, this.style.letterSpacing || 0);
    
    // if advance of this word is less than max-measure, just return.
    if(advance <= rest_measure){
      token.setDevided(false);
      return token;
    }
    // if advance is lager than max_measure,
    // we must cut this word into some parts.
    var part = token.cutMeasure(this.style.font.size, rest_measure); // get sliced word
    part.setMetrics(this.style.flow, this.style.font); // metrics for first half
    token.setMetrics(this.style.flow, this.style.font); // metrics for second half
    this.stream.prev(); // re-parse this token because rest part is still exists.
    return part;
  };

  InlineGenerator.prototype._getMeasure = function(element){
    if(element instanceof Box){
      return element.getBoxMeasure(this.style.flow);
    }
    if(element.getAdvance){
      return element.getAdvance(this.style.flow, this.style.letterSpacing || 0);
    }
    return 0; // TODO
  };

  InlineGenerator.prototype._addElement = function(context, element, measure){
    context.addInlineElement(element, measure);
  };

  return InlineGenerator;
})();

