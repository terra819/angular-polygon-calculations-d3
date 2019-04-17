import { Component, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';
import { Shape } from './shape';
const uuidV4 = require('uuid/v4');
// adapted from
// http://jsfiddle.net/eZQdE/43/

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  shapes = [];
  dragging = false;
  drawing: Shape;
  startPoint: any;
  svg: any;

  ngAfterViewInit() {
    this.svg = d3.select('svg');
  }

  handleMouseMove(event: any) {
    if (!this.drawing) return;
    const g = this.svg.select('#' + this.drawing.id);
    g.select('line').remove();
    let line = g.insert('line', ':first-child')
      .attr('x1', this.startPoint[0])
      .attr('y1', this.startPoint[1])
      .attr('x2', event.offsetX)
      .attr('y2', event.offsetY)
      .attr('stroke', '#53DBF3')
      .attr('stroke-width', 1);
    //calculate line length
    const midPoint = { x: (this.startPoint[0] + event.offsetX) / 2, y: (this.startPoint[1] + event.offsetY) / 2 };
    g.select('text.tempLabel').remove();
    let text = g.insert('text', ':first-child')
      .attr('x', midPoint.x)
      .attr('y', midPoint.y)
      .attr('temp-label', 'true')
      .attr('text-anchor', 'middle')
      .attr("class", "tempLabel")//easy to style with CSS
      .text(
        Math.round(line.node().getTotalLength() * 100) / 100);
  }

  handleMouseUp(event: any) {
    if (this.dragging) return;
    if (event.target.hasAttribute('is-handle')) {
      return this.closePolygon(event);
    };
    this.startPoint = [event.offsetX, event.offsetY];

    let g;
    if (!this.drawing) {
      const shape = new Shape();
      shape.id = 'shape_' + uuidV4();
      this.shapes.push(shape);
      this.drawing = shape;
      g = this.svg.append('g').attr('id', shape.id);
    } else {
      g = this.svg.select('#' + this.drawing.id);
    }

    this.drawing.points.push(this.startPoint);
    g.select('polyline').remove();
    let polyline = g.append('polyline').attr('points', this.drawing.points)
      .style('fill', 'none')
      .attr('stroke', '#000');
    g.select('text.tempLabel').remove();

    for (let i = 0; i < this.drawing.points.length; i++) {
      g.append('circle')
        .attr('cx', this.drawing.points[i][0])
        .attr('cy', this.drawing.points[i][1])
        .attr('r', 4)
        .attr('fill', 'yellow')
        .attr('stroke', '#000')
        .attr('is-handle', 'true')
        .style({ cursor: 'pointer' });
    }

    this.updateLabels(this.drawing);
    this.updatePoints(this.drawing);


  }

  handleDrag(event) {
    if (this.drawing) return;
    var dragCircle = d3.select(this), newPoints = [], circle;
    this.dragging = true;
    var poly = d3.select(this.parentNode).select('polygon');
    var circles = d3.select(this.parentNode).selectAll('circle');
    dragCircle
      .attr('cx', d3.event.x)
      .attr('cy', d3.event.y);
    for (var i = 0; i < circles._groups[0].length; i++) {
      circle = d3.select(circles._groups[0][i]);
      newPoints.push([circle.attr('cx'), circle.attr('cy')]);
    }
    poly.attr('points', newPoints);
  }

  closePolygon(event: any) {
    const dragger = d3.drag()
      .on('drag', this.handleDrag)
      .on('end', function (d) {
        this.dragging = false;
      });
    const svg = d3.select('svg');
    // svg.select('g.drawPoly').remove();
    const g = svg.insert('g', ':first-child')
    g.append('polygon')
      .attr('points', this.drawing.points)
      .style('fill', 'FFF');
    // g.selectAll('circles').remove();
    // for (var i = 0; i < this.drawing.points.length; i++) {
    //   var circle = g.selectAll('circles')
    //     .data([this.drawing.points[i]])
    //     .enter()
    //     .append('circle')
    //     .attr('cx', this.drawing.points[i][0])
    //     .attr('cy', this.drawing.points[i][1])
    //     .attr('r', 4)
    //     .attr('fill', '#FDBC07')
    //     .attr('stroke', '#000')
    //     .attr('is-handle', 'true')
    //     .style("cursor", "move")
    //     .call(dragger);
    // }

    // this.points.splice(0);
    this.updatePoints(this.drawing);
    this.drawing = undefined;
  }

  updateLabels(shape: Shape) {
    const g = this.svg.select('#' + this.drawing.id);
    g.selectAll('text.label').remove();
    for (let i = 1; i < shape.points.length; i++) {
      const point1 = shape.points[i - 1];
      const point2 = shape.points[i];
      const midPoint = this.findMidPoint(point1, point2);
      const text = this.findLength(point1, point2);
      g.insert('text', ':first-child')
        .attr('x', midPoint.x)
        .attr('y', midPoint.y)
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .text(text);
    }
  }

  findMidPoint(point1, point2) {
    return { x: (point1[0] + point2[0]) / 2, y: (point1[1] + point2[1]) / 2 };
  }

  findLength(point1, point2) {
    var a = point1[0] - point2[0];
    var b = point1[1] - point2[1];
    return Math.round(Math.sqrt(a * a + b * b) * 100) / 100;
  }

  updatePoints(shape: Shape) {
    const dragger = d3.drag()
      .on('drag', this.handleDrag)
      .on('end', function (d) {
        this.dragging = false;
      });
    const g = this.svg.select('#' + shape.id);
    g.selectAll('circle').remove();
    for (let i = 0; i < shape.points.length; i++) {
      const point = shape.points[i];
      const circle = g.append('circle')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', 4)
        .attr('fill', '#FDBC07')
        .attr('stroke', '#000');

      if (i === 0) {
        circle.attr('is-handle', 'true')
          .style("cursor", "pointer");
      }
    }
  }
}
