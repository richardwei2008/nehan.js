var ChildBlockTreeGenerator = TreeGenerator.extend({
  // resize page to sum of total child size.
  _onCompleteBlock : function(page){
    page.shortenExtent(page.getParentFlow());
  }
});
