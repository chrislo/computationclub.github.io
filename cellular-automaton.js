/* jshint bitwise: false */
/* global window */

(function (exports) {
  'use strict';

  var Rule = (function () {
    var constructor = function (number) {
      this.number = number;
    };

    constructor.prototype.apply = function (p, q, r) {
      return !!(this.number & (1 << ((p << 2) | (q << 1) | (r << 0))));
    };

    return constructor;
  }());

  var CellularAutomaton = (function () {
    var padCells = function () {
      this.cells.unshift(false);
      this.left--;
      this.cells.push(false);
      this.right++;
    };

    var trimCells = function () {
      if (!this.cells[0]) {
        this.cells.shift();
        this.left++;
      }

      if (!this.cells[this.cells.length - 1]) {
        this.cells.pop();
        this.right--;
      }
    };

    var constructor = function (options) {
      this.rule = options.rule;
      this.cells = options.cells;
      this.left = 0;
      this.right = this.cells.length - 1;
    };

    constructor.prototype.step = function () {
      padCells.call(this);

      this.cells = this.cells.map(function (middle, column) {
        return this.rule.apply(this.cells[column - 1], middle, this.cells[column + 1]);
      }, this);

      trimCells.call(this);
    };

    constructor.prototype.cellAt = function (column) {
      return this.cells[column - this.left];
    };

    return constructor;
  }());

  var CellGrid = (function () {
    var scrollContext = function (context, columns, rows, cellSize) {
      var width = columns * cellSize, height = rows * cellSize;

      var imageData = context.getImageData(0, cellSize, width, height - cellSize);
      context.putImageData(imageData, 0, 0);
      context.clearRect(0, height - cellSize, width, cellSize);
    };

    var nextRow = function () {
      if (this.row < this.rows - 1) {
        ++this.row;
      } else {
        scrollContext(this.context, this.columns, this.rows, this.cellSize);
      }
    };

    var drawCell = function (context, column, row, size) {
      context.fillRect(column * size, row * size, size, size);
    };

    var constructor = function (options) {
      this.canvas = options.canvas;
      this.cellSize = options.cellSize;

      this.row = 0;
      this.context = this.canvas.getContext('2d');
      this.columns = Math.floor(this.canvas.width / this.cellSize);
      this.rows = Math.floor(this.canvas.height / this.cellSize);
    };

    constructor.prototype.draw = function (cellularAutomaton) {
      for (var column = 0; column < this.columns; ++column) {
        if (cellularAutomaton.cellAt(column)) {
          drawCell(this.context, column, this.row, this.cellSize);
        }
      }

      nextRow.call(this);
    };

    return constructor;
  }());

  var makeCells = function (cellCount) {
    var cells = new Array(cellCount);

    for (var i = 0; i < cellCount; ++i) {
      cells[i] = false;
    }
    cells[cellCount - 1] = true;

    return cells;
  };

  exports.drawCellularAutomaton = function (options) {
    var cellGrid = new CellGrid({
      canvas: options.canvas,
      cellSize: options.cellSize
    });

    var cellularAutomaton = new CellularAutomaton({
      rule: options.rule,
      cells: makeCells(cellGrid.columns)
    });

    window.setInterval(function () {
      cellGrid.draw(cellularAutomaton);
      cellularAutomaton.step();
    }, 1000 / options.rowsPerSecond);
  };

  exports.Rule = Rule;
}(this));
