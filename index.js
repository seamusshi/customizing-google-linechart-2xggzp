import "./style.scss";
import $ from "jquery";
var global;
global.jQuery = $;

(function() {
  var linechart = $("#linechart");
  var legendDiv = $("#linechart-legend");
  var legendNamesDiv = $("#linechart-legend-names");

  if (linechart.length && $(window).width() > 767) {
    google.charts.setOnLoadCallback(drawLineChart);
  }

  function drawLineChart() {
    var json =
      "https://my-json-server.typicode.com/miresk/custome-line-chart/db";
    var data = formatDataForLineChart(json);
    var options = {
      chartArea: { left: 0, top: 0, width: "100%", height: "80%" },
      axes: {
        x: {
          0: { side: "bottom", label: "", format: "d MMM" }
        }
      },
      legend: { position: "none" },
      height: 350,
      colors: [
        "#0000ff",
        "#ff00ff",
        "#14914c",
        "orange",
        "#04ffff",
        "#ff0000",
        "#fff004",
        "#00aeef",
        "#1ABF64",
        "#DDAD00",
        "#dc572b",
        "#1abf64",
        "brown",
        "lime",
        "orange",
        "#000000",
        "purple"
      ],
      selectionMode: "multiple"
    };

    // set black color for the overall line
    var lastLine = data.getNumberOfColumns() - 2;
    options.colors[lastLine] = "#000000";

    var view = new google.visualization.DataView(data);
    var chart = new google.charts.Line(document.getElementById("linechart"));

    // initial drawing
    chart.draw(view, options);

    google.visualization.events.addListener(chart, "ready", function() {
      var colsNum = data.getNumberOfColumns();
      var legendAr = [];

      // Make rect viewport higher for the circles
      var rectHeight =
        parseInt($("#linechart svg #rablfilter0 rect").attr("height")) + 5;
      $("#linechart svg #rablfilter0 rect").attr("height", rectHeight);

      // path interactivity - setting supplier IDs to paths
      var svg = linechart.find("svg");
      var paths = svg.find("path");
      paths.each(function(i, item) {
        i++;
        var id = data.getColumnId(i);
        item.setAttribute("data-id", id);
      });

      linechart.find("svg path").on("click", function() {
        var pathID = $(this).data("id");
        var checkbox = legendNamesDiv.find(
          'div label input[data-id="' + pathID + '"]'
        );
        var first = isItFirstClick();
        updateLineChartCols(checkbox, first);
      });

      // loop through columns and generate legend and checkboxes with labels
      for (var i = 1; i < colsNum; i++) {
        var legendName = data.getColumnLabel(i);
        var legendColor = options.colors[i - 1];
        var id = data.getColumnId(i);
        var label = createLabel(legendName, id);
        var legend = createLegend(legendName, id, legendColor);

        if (i == colsNum - 1) {
          $("#linechart svg")
            .find('[data-id="category-benchmark"]')
            .css("stroke-dasharray", "3");
        } else {
          legendDiv.find(".labels").append(label);
          legendAr[i - 1] = legend;
        }
      }

      var colCount = 4;
      var rows = Math.floor(legendAr.length / colCount);
      var rest = legendAr.length % colCount;
      var y = rest;

      if (legendAr.length < colCount) {
        rest = 0;
        rows = 1;
      }

      var legendsColsHtml = '<div class="row">';

      for (var i = 0; i < legendAr.length - rest; i++) {
        if (i % rows == 0) {
          if (i > 0 && y-- > 0 && rest > 0) {
            legendsColsHtml += legendAr[legendAr.length - y - 1];
          }
          legendsColsHtml +=
            i > 0 ? '</div><div class="col-sm-3">' : '<div class="col-sm-3">';
        }
        legendsColsHtml += legendAr[i];
      }

      legendsColsHtml += "</div>";
      legendNamesDiv.append(legendsColsHtml);

      // populate top filter with checkboxes
      // using template literals
      function createLabel(name, i) {
        var label = `<label for="${i}" class="niceCheckbox on" data-group="suppliersGroup">
	      						<input class="legendCheckbox" type="checkbox" id="${i}" data-id="${i}" name="filterCheck" value="${name}" checked>
	      						<span class="text">${name}</span>
	      					</label>`;
        return label;
      }

      // create legend under the linechart
      // without template literals
      function createLegend(name, i, color) {
        var legend =
          "<div>" +
          '<span class="text" data-color="' +
          color +
          '">' +
          name +
          "</span>" +
          '<label class="niceCheckbox linechartLegend" data-group="suppliersGroup">' +
          '<input class="legendCheckbox" type="checkbox" data-id="' +
          i +
          '" data-supplier-id="' +
          i +
          '" name="filterCheck" value="' +
          name +
          '" checked>' +
          "</label>" +
          '<style>[data-color="' +
          color +
          '"]:before{background:' +
          color +
          ";}</style>" +
          "</div>";
        return legend;
      }

      // update linechart when clicked on label under the chart
      legendNamesDiv.find("span").on("click", function() {
        var label = $(this);
        var check = label.parent().find("label input");
        var first = isItFirstClick();
        check.toggleClass("opa");
        updateLineChartCols(check, first);
      });
    });
  }

  function formatDataForLineChart(data) {
    var jsonData = $.ajax({
      url: data,
      dataType: "json",
      async: false
    }).responseText;
    var formattedData = JSON.parse(jsonData);
    var dataCols = [{ id: "id" + 0, label: "Date", type: "string" }];
    var dataRow = [];
    var n = [];
    var ids = [];
    var i = 0;
    var monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];

    $.each(formattedData, function(index, days) {
      var dayIndex = index;
      var date = new Date(dayIndex + "Z");
      var dd = date.getDate();
      var mm = monthNames[date.getMonth()];
      var formattedDate = dd + " " + mm;
      var v = [];

      $.each(days, function(index, val) {
        v[index] = val.overallAverageValue;
        n[index] = val.supplierName;
        ids[index] = val.supplierId;
        if (val.benchmarkCategory == "category") {
          ids[index] = "category-benchmark";
        }
      });

      dataRow[i++] = { c: [{ v: formattedDate }] };

      $.each(v, function(index, val) {
        dataRow[i - 1].c[index + 1] = { v: val };
      });
    });

    // Cols header
    $.each(n, function(index, val) {
      dataCols[index + 1] = { id: ids[index], label: val, type: "number" };
    });

    var result = new google.visualization.DataTable(
      {
        cols: dataCols,
        rows: dataRow
      },
      0.6
    );

    return result;
  }

  /**
   * update(show/hide) lines/rows/cells across all charts
   *
   * @param {object} elem - selected element
   * @param {boolean} firstClick - if all checkboxes are selected we have to unselect others first
   */
  function updateLineChartCols(elem, firstClick) {
    var allCheckboxes = getChecxboxes();
    var id = elem.data("id");
    var svg = linechart.find("svg");
    var paths = svg.find("path");
    var topLegend = legendDiv.find('.legendCheckbox[data-id="' + id + '"]');
    var chartLegend = legendNamesDiv.find(
      '.legendCheckbox[data-id="' + id + '"]'
    );
    var inputsArr = [topLegend, chartLegend];

    var checkedCount = 0;
    var minCount = 2;

    // when all cells/rows are active, we make them inactive except the selected one
    if (firstClick) {
      for (var i = 0; i < allCheckboxes.length; i++) {
        allCheckboxes[i].prop("checked", false);
      }
      setOpacityForAll();
      elem.trigger("click");
    } else {
      elem.trigger("click");
    }

    var isChecked = elem[0].checked;

    if (isChecked) {
      syncCheckboxes(isChecked);
      disableIfMinValue();
      removePathOpacity();
    } else {
      syncCheckboxes(isChecked);
      disableIfMinValue();
      setPathOpacity();
      // reset and mark all as active when 0 checked
      var numOfChecked = $('input[name="filterCheck"]:checked').length;
      if (numOfChecked === 0) {
        for (var i = 0; i < allCheckboxes.length; i++) {
          allCheckboxes[i].prop("checked", true);
        }
        removeOpacityForAll();
        enableCheckbox();
      }
    }

    function syncCheckboxes(isChecked) {
      if (isChecked === false) {
        for (var i = 0; i < inputsArr.length; i++) {
          inputsArr[i].prop("checked", false);
        }
      } else {
        for (var i = 0; i < inputsArr.length; i++) {
          inputsArr[i].prop("checked", true);
        }
      }
      // update count
      allCheckboxes[0].each(function(i, item) {
        if (item.checked === true) {
          checkedCount++;
        }
      });
    }

    function setPathOpacity() {
      svg
        .find('path[data-id="' + id + '"]')[0]
        .setAttribute("stroke-opacity", 0.3);
      topLegend.parent().removeClass("on");
      chartLegend
        .parent()
        .prev()
        .addClass("opa");
    }

    function setOpacityForAll() {
      legendDiv.find("label").removeClass("on");
      legendNamesDiv.find("span").addClass("opa");
      $(".cellInfo").addClass("inactive");

      paths.each(function(i, item) {
        var idi = item.getAttribute("data-id");
        if (idi != "category-benchmark" && idi != "category-name") {
          item.setAttribute("stroke-opacity", 0.3);
        }
      });
    }

    function removeOpacityForAll() {
      legendDiv.find("label").addClass("on");
      legendNamesDiv.find("span").removeClass("opa");
      $(".cellInfo").removeClass("inactive");

      paths.each(function(i, item) {
        console.log("item");
        item.setAttribute("stroke-opacity", 1);
      });
    }

    function removePathOpacity() {
      svg
        .find('path[data-id="' + id + '"]')[0]
        .setAttribute("stroke-opacity", 1);
      topLegend.parent().addClass("on");
      chartLegend
        .parent()
        .prev()
        .removeClass("opa");
    }

    function disableIfMinValue() {
      if (checkedCount < minCount) {
        disableCheckbox();
      } else {
        enableCheckbox();
      }
    }

    function hideLine() {
      visibleLines = visibleLines.filter(function(obj) {
        return obj !== id;
      });
      elem.parent().removeClass("on");
    }

    // view.setColumns(visibleLines);
    // chart.draw(view, options);
  }

  function getChecxboxes() {
    var allCheckboxes = legendDiv.find(".legendCheckbox");
    var allChartCheckboxes = legendNamesDiv.find(".legendCheckbox");
    var checkboxes = [allCheckboxes, allChartCheckboxes];
    return checkboxes;
  }

  function isItFirstClick(elem) {
    var firstClick = false;
    var numOfCheckboxes = $('input[name="filterCheck"]').length;
    var numOfChecked = $('input[name="filterCheck"]:checked').length;
    // if all checked disable all but clicked
    if (numOfCheckboxes === numOfChecked) {
      firstClick = true;
    } else {
      firstClick = false;
    }
    return firstClick;
  }

  function enableCheckbox() {
    legendDiv.find(".legendCheckbox:checked").attr("disabled", false);
  }

  function disableCheckbox() {
    legendDiv.find(".legendCheckbox:checked").attr("disabled", true);
  }
})(jQuery);
