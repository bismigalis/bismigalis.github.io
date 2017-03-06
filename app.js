// CONSTANTS
var ELEMENT_WIDTH = 54;
var DELAY = 1000;

// CLASSES

/**
 * Class represents renderer of the cells
 * @constructor
 * @param {string} selector name of id selector where components will be rendered
 * @param {array} arr array of numbers
 * @param {array} q Array of commands. Command is an array like ['command', 'arg1', 'arg2']
 * @param {function} endCallback Callback which will be called after process ends
 */
var SortComponent = function(selector, arr, q, endCallback) {
   var i;

   this.continue = true;

   this.arr = arr;
   this.q = q;
   this.endCallback = endCallback;

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
 * @param {array} command array of type ['command', arg1, arg2]
 */
SortComponent.prototype.processCommand = function (command) {
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

/**
 * method that starts show process
 */
SortComponent.prototype.startShow = function() {
   this.continue = true;
   var self = this;
   self.timerId = setTimeout(function tick() {

      if(self.q.length) {
         if(self.continue) {
            self.processCommand(self.q.shift());
            self.timerId = setTimeout(tick, DELAY);
         }
      } else {
         self.endCallback();
      }
   }, DELAY);
};
/**
 * method that starts show process
 */
SortComponent.prototype.stopShow = function() {
   this.continue = false;
   //clearTimeout(this.timerId);
}

/**
 * method to add element to html and into container simultaniously
 * @param {string} text text used as content of element
 * @param {string} klass string of css class names separated by whitespace
 * @param {array} container array in which elements will be pushed
 */
SortComponent.prototype.addElement_ = function(text, klass, container) {
   var el = $('<div class="' + klass + '">' + text + '</div>');
   container.push(el);
   el.css('left', ELEMENT_WIDTH*(container.length-1)+'px');
   this.el.append(el);
};

/**
 * Mark cells that compared.
 * @param {number} i index in the container
 */
SortComponent.prototype.markCompare = function(i) {
   var new_x1 = ELEMENT_WIDTH * (i-1) +'px';
   var new_x2 = ELEMENT_WIDTH * i +'px';
   this.compareMarks[0].animate({left: new_x1}, DELAY/3);
   this.compareMarks[1].animate({left: new_x2}, DELAY/3);

};

SortComponent.prototype.unmarkCompare = function(i) {
   $(this.elements).each(function(i, e){e.removeClass('compare');});
};

/**
 * Mark cell that considers maximux on current stage
 * @param {number} i index in the container
 */
SortComponent.prototype.markMax = function(i) {
   this.unmarkCompare();
   this.elements[i].addClass('max');
};

/**
 * Swaps two cells with animation
 * @param {number} i1 index in the container for first element
 * @param {number} i2 index in the container for second element
 */
SortComponent.prototype.swap = function(i1, i2) {
   var old_i1 = this.elements[i1].css('left');
   var old_i2 = this.elements[i2].css('left');

   this.elements[i1].animate({left: old_i2}, DELAY/3);
   this.elements[i2].animate({left: old_i1}, DELAY/3);

   var tmp = this.elements[i2];
   this.elements[i2] = this.elements[i1];
   this.elements[i1] = tmp;

};

/** Callback invoked at the end */
SortComponent.prototype.end = function() {
   $(this.compareMarks).each(function(i, e) { e.css('border-color', 'black'); });
};

//FUNCTIONS
/**
 * @param {number} len length of the array
 * @param {number} maxValue maximum value under which elements are generated
 * @return {array} array of numbers
 */
function getInitialArray(len, minValue, maxValue) {
   var arr = [];

   for(var i=0; i<len; i++) {
      arr.push(minValue + Math.floor(Math.random() * (1+maxValue-minValue)));
   }

   return arr;
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
 * entry point
 */
function main() {
   var form = new Vue({
      el: '#app',
      data: {
         QUANTITY_MIN: 2,
         QUANTITY_MAX: 20,
         RANGE_FROM: 0,
         RANGE_TO: 99,

         array_init_method: 'generate',
         raw_array: '',
         in_array: [],
         out_array: [],
         form_visible: true,
         paused: false,
         //form
         quantity_input: 'random',
         quantity: 10,
         range_input: 'random',
         range_from: 0,
         range_to: 99,
         //controls
         startShowButtonEnabled: true,
         pauseEnabled: false,
         resetEnabled: false
      },
      computed: {
         sanitized_array : function() {
            var m = this.raw_array.match(/[,\d]/g);
            return m ? m.join('').split(",").filter(Boolean).map(Number) : [];
         }
      },
      methods: {
         start_show: function(e) {
            var self = this;
            var arr;
            this.form_visible = false;
            this.startShowButtonEnabled = false;
            this.pauseEnabled = true;
            this.resetEnabled = true;

            if(this.array_init_method == 'generate') {
               var quantity = this.quantity_input=='random' ?
                      this.QUANTITY_MIN + Math.floor(Math.random() * this.QUANTITY_MAX) :
                      this.quantity;
               var range_from = this.range_input=='random' ?
                      this.RANGE_FROM + Math.floor(Math.random() * this.RANGE_TO) :
                      this.range_from;
               var range_to = this.range_input=='random' ?
                      range_from + Math.floor(Math.random() * (this.RANGE_TO - range_from)) :
                      this.range_to;

               arr = getInitialArray(quantity, range_from, range_to);
            } else {
               arr = this.sanitized_array;
            }
            var sortedArr = [];
            var q = [];

            this.in_array = arr;
            this.out_array = sortArray(arr, q);

            this.sc = new SortComponent('#process', arr, q, function() {self.pauseEnabled = false;});
            this.sc.startShow();
         },
         pause: function(e) {
            var self = this;
            if(!this.sc.continue) {
               this.sc.startShow();
            } else {
               this.sc.stopShow();
            }
            self.paused = !this.sc.continue;
         },
         reset: function(e) {
            clearTimeout(this.sc.timerId);
            this.in_array = [];
            this.out_array = [];
            this.form_visible = true;
            this.paused = false;
            this.range_from = 0;
            this.range_to = 100;
            this.startShowButtonEnabled = true;
            this.pauseEnabled = false;
            this.resetEnabled = false;
            $('#process').empty();
         }
      }
   });
}
