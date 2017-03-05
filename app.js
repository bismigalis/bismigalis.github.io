// CONSTANTS
var ELEMENT_WIDTH = 54;
var DELAY = 1000;

// CLASSES

/**
 * Class represents renderer of the cells
 * @constructor
 * @param {string} selector name of id selector where components will be rendered
 * @param {array} arr array of numbers
 */
var Render = function(selector, arr) {
   var i;

   this.el = $(selector);
   this.el.empty();

   this.elements = [];
   this.compareMarks = [];

   // add elements
   for(i=0; i<arr.length; i++) {
      this.addElement_(arr[i], 'cell', this.elements);
   }

   // add marks
   for(i=0; i<2; i++) {
      this.addElement_('', 'cell compare', this.compareMarks);
   }

};

/**
 * method to add element to html and into container simultaniously
 * @param {string} text text used as content of element
 * @param {string} klass string of css class names separated by whitespace
 * @param {array} container array in which elements will be pushed
 */
Render.prototype.addElement_ = function(text, klass, container) {
   var el = $('<div class="' + klass + '">' + text + '</div>');
   container.push(el);
   el.css('left', ELEMENT_WIDTH*(container.length-1)+'px');
   this.el.append(el);
};

/**
 * Mark cells that compared.
 * @param {number} i index in the container
 */
Render.prototype.markCompare = function(i) {
   var new_x1 = ELEMENT_WIDTH * (i-1) +'px';
   var new_x2 = ELEMENT_WIDTH * i +'px';
   this.compareMarks[0].animate({left: new_x1}, DELAY/2);
   this.compareMarks[1].animate({left: new_x2}, DELAY/2);

};

Render.prototype.unmarkCompare = function(i) {
   $(this.elements).each(function(i, e){e.removeClass('compare');});
};

/**
 * Mark cell that considers maximux on current stage
 * @param {number} i index in the container
 */
Render.prototype.markMax = function(i) {
   this.unmarkCompare();
   this.elements[i].addClass('max');
};

/**
 * Swaps two cells with animation
 * @param {number} i1 index in the container for first element
 * @param {number} i2 index in the container for second element
 */
Render.prototype.swap = function(i1, i2) {
   var old_i1 = this.elements[i1].css('left');
   var old_i2 = this.elements[i2].css('left');

   this.elements[i1].animate({left: old_i2}, DELAY/2);
   this.elements[i2].animate({left: old_i1}, DELAY/2);

   var tmp = this.elements[i2];
   this.elements[i2] = this.elements[i1];
   this.elements[i1] = tmp;

};

/** Callback invoked at the end */
Render.prototype.end = function() {
   $(this.compareMarks).each(function(i, e) { e.css('border-color', 'black'); });
};

/**
 * @param {array} command array of type ['command', arg1, arg2]
 */
Render.prototype.processCommand = function (command) {
   switch (command[0]) {
   case 'compare':
      this.markCompare(command[1]);
      break;

   case 'swap':
      this.swap(command[1], command[2]);
      break;

   case 'mark-max':
      this.markMax(command[1]);
      break;

   case 'end':
      this.end();
      break;
   }
};

//FUNCTIONS
/**
 * @param {number} len length of the array
 * @param {number} maxValue maximum value under which elements are generated
 * @return {array} array of numbers
 */
function getInitialArray(len, maxValue) {
   var arr = [];

   for(var i=0; i<len; i++) {
      arr.push(Math.floor(Math.random() * maxValue));
   }

   return arr;
}

/**
 * Helper function to print in and out arrays
 * @param {array} arr array of numbers
 * @param {string} where name of the id selector where to print
 */
function showArray(arr, where) {
   $('#'+where).empty().append(JSON.stringify(arr));
}

/**
 * Function that given an array of numbers and empty array, return sorted array
 * and in process of sorting records commands into the given array 'q'
 * @param {array} inArr array of numbers
 * @param {array} q empty array in which commands will be pushed in process of sorting
 * @return {array} sorted array
 */
function sortArray(inArr, q) {
   var arr = inArr.slice(), //copy array
       len = arr.length,
       temp = undefined;

   for(var m=len; m>1; m--) {
      for(var i=1; i<m; i++) {
         q.push(["compare", i]);
         if(arr[i] < arr[i-1]) {
            temp = arr[i];
            arr[i] = arr[i-1];
            arr[i-1] = temp;
            q.push(["swap", i-1, i]);
         }
      }
      q.push(["mark-max", m-1]);
   }
   q.push(["end"]);

   return arr;
}

/**
 * Function that starts show process
 * @param {array} arr Array of numbers
 * @param {array} q Array of commands. Command is an array like ['command', 'arg1', 'arg2']
 * @param {function} callback Callback which will be called after process ends
 */
function startShow(arr, q, callback) {
   var r = new Render('#process', arr);

   var timerId = setTimeout(function tick() {
      r.processCommand(q.shift());
      if(q.length) {
         setTimeout(tick, DELAY);
      } else {
         callback();
      }
   }, DELAY);
}

/**
 * Callback on end of the show process
 */
function endCallback() {
   $( "#start-button").prop( "disabled", false);
}

/**
 * Callback on start button
 */
function start() {
   $( "#start-button").prop( "disabled", true);

   var arr = getInitialArray(10, 100),
       sortedArr = [],
       q = [];
   showArray(arr, 'in');
   showArray(sortArray(arr, q), 'out');
   startShow(arr, q, endCallback);
}

/**
 * entry point
 */
function main() {
   $('#start-button').click(start);
}
