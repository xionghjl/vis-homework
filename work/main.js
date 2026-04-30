// 1. 设置画布尺寸和边距
const margin = {top: 40, right: 10, bottom: 20, left: 10},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2. 加载 JSON 数据
d3.json("titanic_clean.json").then(function(data) {

  // 定义要在图表中展示的维度及顺序
  const dimensions = ["Pclass", "Sex", "Age", "Survived"];

  // 3. 为每个维度构建 Y 轴比例尺 (Scale)
  const y = {};
  dimensions.forEach(function(name) {
    if (name === "Age") {
      // 年龄是连续数值，使用线性比例尺
      y[name] = d3.scaleLinear()
        .domain(d3.extent(data, d => d[name]))
        .range([height, 0]);
    } else {
      // 舱位、性别、是否存活是分类数据，使用离散比例尺
      const categories = [...new Set(data.map(d => d[name]))];
      y[name] = d3.scalePoint()
        .domain(categories)
        .range([height, 0])
        .padding(0.1); // 增加内边距让点不要顶在坐标轴两端
    }
  });

  // 构建 X 轴比例尺（将不同维度的轴平铺排列）
  const x = d3.scalePoint()
    .range([0, width])
    .domain(dimensions);

  // 颜色比例尺：按存活与否区分颜色（存活为青色，死亡为橙红色）
  const color = d3.scaleOrdinal()
    .domain(["Survived", "Died"])
    .range(["#00d2d3", "#ff6b6b"]);

  // 4. 绘制数据折线
  const path = d => d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));

  const lines = svg.append("g")
    .selectAll("path")
    .data(data)
    .enter()
    .append("path")
      .attr("class", "line")
      .attr("d", path)
      .style("stroke", d => color(d.Survived));

  // 5. 绘制平行的坐标轴
  const axes = svg.selectAll("myAxis")
    .data(dimensions)
    .enter()
    .append("g")
      .attr("transform", d => `translate(${x(d)})`);

  axes.each(function(d) {
      d3.select(this).call(d3.axisLeft().scale(y[d]));
    })
    .append("text") // 轴标题
      .attr("class", "axis-title")
      .attr("y", -15)
      .text(d => d);

  // === 6. 添加交互：D3 笔刷 (Brushing) ===
  const extents = {}; // 记录每个轴上的刷选范围

  // 笔刷滑动时的回调函数
  function brushed(event, d) {
    if (event.selection) {
      extents[d] = event.selection; // 记录当前轴被框选的坐标范围 [y_min, y_max]
    } else {
      delete extents[d]; // 如果点击空白处清空刷选，则删除记录
    }

    // 遍历所有折线，判断其是否在所有刷选范围内
    lines.classed("hidden", function(record) {
      return !dimensions.every(function(p) {
        if (!extents[p]) return true; // 如果这个轴没有刷选，则通过
        // 计算该数据点在图表上的 Y 坐标
        const yPos = y[p](record[p]);
        // 检查 Y 坐标是否落在框选范围 extents[p] 之间
        return extents[p][0] <= yPos && yPos <= extents[p][1];
      });
    });
  }

  // 将笔刷附加到每一根坐标轴上
  axes.each(function(d) {
    d3.select(this)
      .append("g")
      .attr("class", "brush")
      .call(d3.brushY()
        .extent([[-10, 0], [10, height]])
        .on("brush end", (event) => brushed(event, d))
      );
  });

}).catch(error => {
    console.error("加载数据出错:", error);
});