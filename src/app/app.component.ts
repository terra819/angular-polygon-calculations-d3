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

    g.select('text.temp-line-label').remove();
    this.addLineLabel(g, [this.startPoint[0], this.startPoint[1]], [event.offsetX, event.offsetY], true);

    if (this.drawing.points.length > 1) {
      g.select('text.temp-angle-label').remove();
      const A = this.drawing.points[this.drawing.points.length - 2];
      const B = this.drawing.points[this.drawing.points.length - 1];
      const C = [event.offsetX, event.offsetY];
      this.addAngleLabel(g, A, B, C, true);
    }
  }

  handleMouseUp(event: any) {
    if (this.dragging) return;
    if (event.target.hasAttribute('is-handle')) {
      return this.closePolygon(event);
    };
    this.startPoint = [event.offsetX, event.offsetY];

    if (!this.drawing) {
      const shape = new Shape();
      shape.id = 'shape_' + uuidV4();
      this.shapes.push(shape);
      this.drawing = shape;
      this.svg.append('g').attr('id', shape.id);
    }
    const g = this.svg.select('#' + this.drawing.id);
    this.drawing.points.push(this.startPoint);
    g.select('polyline').remove();
    let polyline = g.append('polyline').attr('points', this.drawing.points)
      .style('fill', 'none')
      .attr('stroke', '#000');
    g.select('text.temp-line-label').remove();
    this.updateLineLabels();
    this.updateAngleLabels();
    this.updatePoints();
    this.updateAreaLabel();
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
    const svg = d3.select('svg');
    const g = this.svg.select('#' + this.drawing.id);
    g.insert('polygon', ':first-child')
      .attr('points', this.drawing.points)
      .style('fill-opacity', '0')
      .attr('stroke', '#000');

    g.select('polyline').remove();
    g.select('line').remove();
    g.select('text.temp-line-label').remove();

    this.updatePoints(true);
    this.updateLineLabels(true);
    this.updateAngleLabels(true);
    this.updateAreaLabel();
    this.drawing = undefined;
  }

  updateLineLabels(closed: boolean = false) {
    const g = this.svg.select('#' + this.drawing.id);
    g.selectAll('text.line-label').remove();
    let point1;
    let point2;
    for (let i = 1; i < this.drawing.points.length; i++) {
      point1 = this.drawing.points[i - 1];
      point2 = this.drawing.points[i];

      this.addLineLabel(g, point1, point2);
    }
    if (closed) {
      point1 = this.drawing.points[0];
      point2 = this.drawing.points[this.drawing.points.length - 1];
      this.addLineLabel(g, point1, point2);
    }
  }

  addLineLabel(g, point1, point2, temp: boolean = false) {
    const midPoint = this.findMidPoint(point1, point2);
    const text = this.findLength(point1, point2);
    let lineClass = 'line-label';
    if (temp) { lineClass = 'temp-'.concat(lineClass) }
    let label = g.insert('text', ':first-child')
      .attr('x', midPoint.x)
      .attr('y', midPoint.y)
      .attr('text-anchor', 'middle')
      .attr('class', lineClass)
      .text(text);
  }

  findMidPoint(point1, point2) {
    return { x: (point1[0] + point2[0]) / 2, y: (point1[1] + point2[1]) / 2 };
  }

  findLength(point1, point2) {
    var a = point1[0] - point2[0];
    var b = point1[1] - point2[1];
    return Math.round(Math.sqrt(a * a + b * b) * 100) / 100;
  }

  updatePoints(closed: boolean = false) {
    const g = this.svg.select('#' + this.drawing.id);
    g.selectAll('circle').remove();
    for (let i = 0; i < this.drawing.points.length; i++) {
      const point = this.drawing.points[i];
      const circle = g.append('circle')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', 4)
        .attr('fill', '#FDBC07')
        .attr('stroke', '#000');
      if (closed) {
        const dragger = d3.drag()
          .on('drag', this.handleDrag)
          .on('end', function (d) {
            this.dragging = false;
          });
        circle.call(dragger)
          .style("cursor", "move");
      } else {
        if (i === 0) {
          circle.attr('is-handle', 'true')
            .style("cursor", "pointer");
        }
      }
    }
  }

  updateAngleLabels(closed: boolean = false) {
    let A, B, C;
    if (this.drawing.points.length > 2) {
      const g = this.svg.select('#' + this.drawing.id);
      g.select('text.angle-label').remove();
      for (let i = 0; i < this.drawing.points.length - 2; i++) {
        A = this.drawing.points[i];
        B = this.drawing.points[i + 1];
        C = this.drawing.points[i + 2];
        this.addAngleLabel(g, A, B, C);
      }
      if (closed) {
        A = this.drawing.points[this.drawing.points.length - 1];
        B = this.drawing.points[0];
        C = this.drawing.points[this.drawing.points.length - 2];
        this.addAngleLabel(g, A, B, C);
      }
    }
  }

  addAngleLabel(g, A, B, C, temp: boolean = false) {
    let angleClass = 'angle-label';
    if (temp) { angleClass = 'temp-'.concat(angleClass) }
    const angle = this.findAngle(A, B, C);
    let text = g.insert('text', ':first-child')
      .attr('x', B[0])
      .attr('y', B[1])
      .attr('text-anchor', 'middle')
      .attr("class", angleClass)
      .text(`${Math.round(angle * 100) / 100}\xB0`);
  }

  findAngle(A, B, C) {
    var AB = Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2));
    var BC = Math.sqrt(Math.pow(B[0] - C[0], 2) + Math.pow(B[1] - C[1], 2));
    var AC = Math.sqrt(Math.pow(C[0] - A[0], 2) + Math.pow(C[1] - A[1], 2));
    const angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    return (angle * 180) / Math.PI;
  }

  updateAreaLabel() {
    const g = this.svg.select('#' + this.drawing.id);
    const polygon = g.select('polygon');
    if (!polygon.empty()) {
      const area = d3.polygonArea(this.drawing.points);
      const centroid = d3.polygonCentroid(this.drawing.points);
      let text = g.insert('text', ':first-child')
        .attr('x', centroid[0])
        .attr('y', centroid[1])
        .attr('text-anchor', 'middle')
        .attr("class", 'area-label')
        .text(area);
    }
  }
}
