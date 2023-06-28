// -*- js-indent-level: 2 -*-
(function (root, factory) {
  root.Index = factory(root);
  console.log("Document is ready");
}(this, function(root) {
  'use strict';
  var document = root.document;
  var Index = {};
  // More info about config & dependencies:
  // - https://github.com/hakimel/reveal.js#configuration
  // - https://github.com/hakimel/reveal.js#dependencies
  Reveal.initialize({

	// Factor of the display size that should remain empty around the content
	margin: 0.02,

    center : false,

    transition : "fade",
    history : true,
    slideNumber: 'c/t',
    controls: false,
    showNotes: false,
    dependencies: [
      { src: 'reveal.js/plugin/markdown/marked.js' },
      { src: 'reveal.js/plugin/markdown/markdown.js' },
      { src: 'reveal.js/plugin/notes/notes.js', async: true },
      { src: 'reveal.js/plugin/highlight/highlight.js',
        async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
      { src: 'reveal.js/plugin/math/math.js', async: true }
    ]
  });

  Index.getSVGObjElementById = function (svg_ele, ele_id) {
    return svg_ele.getSVGDocument().getElementById(ele_id);
  }
  Index.getSVGElementById = function (svg_id, ele_id) {
    return Index.getSVGObjElementById(document.getElementById(svg_id), ele_id);
  }

  Reveal.addFragmentListner = function (
    fragment_id,
    on_fragment_shown, on_fragment_hidden)
  {
    Reveal.addEventListener("fragmentshown", function(e) {
      Array.from(e.fragments).forEach(function (frag) {
        if (frag.id == fragment_id)
          on_fragment_shown(frag);
      });
    }, false);
    Reveal.addEventListener("fragmenthidden", function(e) {
      Array.from(e.fragments).forEach(function (frag) {
        if (frag.id == fragment_id)
          on_fragment_hidden(frag);
      });
    }, false);
  }

  // *************************************************************
  // Handle videos inside fragments
  // *************************************************************
  var getTagChildren = function (element, tag_name, class_name) {
    var videles;
    if (element.tagName.toUpperCase() == tag_name.toUpperCase()) {
      videles = [element];
    } else {
      videles = Array.from(element.getElementsByTagName(tag_name));
    }
    if (class_name) 
      videles = videles.filter(
        function (v) { return v.classList.contains(class_name) });
    return videles
  }


  // Pause and play videos on slide change
  var pauseVideo = function (element) {
    getTagChildren(element, "video").forEach(function (pvidele) {
      console.log("Pausing : " + pvidele.id);
      pvidele.pause();
    });

    getTagChildren(element, "iframe").forEach(function (pvidele) {
      pvidele.contentWindow.postMessage(
        '{"event":"command","func":"' + 'stopVideo' + '","args":""}', '*'); 
    });
  };

  // Keep a record of previously played videos and pause them before
  // playing the next set of videos.
  var PLAY_ON_FRAGMENT_CLASS = PLAY_ON_FRAGMENT_CLASS;
  var previously_played_videos = [];
  var resetAndPlayVideo = function (element) {
    getTagChildren(element, "video", PLAY_ON_FRAGMENT_CLASS).forEach(function (videle) {
      console.log("Playing : " + videle.id);
      videle.pause();
      videle.currentTime = 0;
      if ( ! videle.classList.contains("pause") ) {
        videle.play();
      }
      previously_played_videos.push(videle);
    });

    getTagChildren(element, "iframe", PLAY_ON_FRAGMENT_CLASS).forEach(function (videle) {
      if ( ! videle.classList.contains("pause") ) {
        videle.src += "&autoplay=1";
      }
    });
  };
  Reveal.addEventListener( 'fragmentshown',
                           function (e) {
                             previously_played_videos.forEach(
                               function (vid) { vid.pause() });
                             previously_played_videos = [];
                             Array.from(e.fragments).forEach(resetAndPlayVideo);
                           } );
  Reveal.addEventListener( 'fragmenthidden',
                           function ( e ) {
                             console.log("fragmenthidden " + e.fragment.id);
                             e.fragments.forEach(pauseVideo);
                           }, false);
  Reveal.addEventListener( 'slidechanged',
                           function ( e ) {
                             if (e.previousSlide) 
                               pauseVideo(e.previousSlide);
                             if (e.currentSlide)
                               getTagChildren(
                                 e.currentSlide,
                                 "video", "slide-play").forEach(function (v) {
                                   v.pause(); v.currentTime = 0; v.play();
                                 });
                           });

  // *************************************************************
  // End of handling videos inside fragments
  // *************************************************************

  // Handle footnotes and citations
  Reveal.addEventListener( 'slidechanged', function( event ) {
    // event.previousSlide, event.currentSlide, event.indexh, event.indexv
    var footerele = document.getElementById("footer");
    footerele.innerHTML = "";
    var footnotelist = event.currentSlide.getElementsByTagName("cite");
    var footnotestrings = [];
    Array.from(footnotelist).forEach(function(fnl) {
      var key = fnl.getAttribute("data-key");
      var value = fnl.innerHTML;
      if ( ! value )
        value = key;
      footnotestrings.push("<span href='" + key + "'>"
                           + value.replace(" ", "&nbsp;") + "</span>");
    });
    footerele.innerHTML = footnotestrings.join(", "); 
  } );

  (// Handle citations to add to bibliography in the end
    function () {
      var added = {};
      Array.from(document.getElementsByTagName("cite")).forEach(
        function (fnl) {
          var key = fnl.getAttribute("data-key");
          if ( ! (key in added) ) {
            var citation = document.getElementById(key);
            if (citation) {
              document.getElementById("bibliography").innerHTML += 
                "<li>" + key
                + " &nbsp;&nbsp;:&nbsp;&nbsp; " + citation.innerHTML
                + "</li>";
              added[key] = 1;
            } else {
              console.log("Citation not found for " + key);
            }
          }
        });
    }());

  // Handle title repetition
  Array.from(document.getElementsByClassName("presentationtitle")).forEach(
    function (pttl) {
    pttl.innerHTML = document.presentationtitle;
  });

  // Handle author repetition
  Array.from(document.getElementsByClassName("presentationauthor")).forEach(
    function (pa) {
    pa.innerHTML = document.presentationauthor;
  });

  Array.from(document.getElementsByClassName("copy-of")).forEach(
    function (copy) {
      if (copy.hasAttribute("data-copy-of")) {
        var copy_of = document.getElementById(copy.getAttribute("data-copy-of"));
        Array.from(copy_of.childNodes).forEach(function (child) {
            copy.appendChild(child.cloneNode(true));
        });
      }
    });

  // remove hidden slides from the slide deck
  (function () {
    var slidedeck = document.querySelectorAll(".reveal .slides")[0];
    Array.from(slidedeck.getElementsByClassName("hideslide")).forEach(
      function (slide) {
        console.log("Removed slide " + slide.id);
        slidedeck.removeChild(slide);
      });
  });

  // If you change the order of slides dynamically, we need to sync the slides with Reveal
  return Index;
}));
