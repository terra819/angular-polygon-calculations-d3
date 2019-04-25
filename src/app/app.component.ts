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
  dragging: Shape;
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

    this.drawing.points.splice(this.drawing.points.length - 1, 1, [event.offsetX, event.offsetY]);
    this.updateShape(this.drawing);
  }

  handleMouseUp(event: any) {
    if (this.dragging) return;
    if (event.target.hasAttribute('is-handle')) {
      return this.closePolygon(this.drawing);
    };
    this.startPoint = [event.offsetX, event.offsetY];

    if (!this.drawing) {
      const shape = new Shape();
      shape.id = 'shape_' + uuidV4(); // to ensure id doesn't start with a number. see https://stackoverflow.com/a/79022/4031083 for explanation
      this.shapes.push(shape);
      this.drawing = shape;
      this.svg.append('g').attr('id', shape.id);
      this.drawing.points.push(this.startPoint);
    }
    const g = this.svg.select('#' + this.drawing.id);
    this.drawing.points.push(this.startPoint);
    g.select('polyline').remove();
    let polyline = g.append('polyline').attr('points', this.drawing.points)
      .style('fill', 'none')
      .attr('stroke', '#000');
    this.updateShape(this.drawing);
  }

  handleDrag(self) {
    return function (d) {
      var dragCircle = d3.select(this), newPoints = [], circle;
      const oldPoint = [Number(dragCircle.attr('cx')), Number(dragCircle.attr('cy'))];
      const newPoint = [d3.event.x, d3.event.y];
      const poly = d3.select(this.parentNode).select('polygon');
      const circles = d3.select(this.parentNode).selectAll('circle');
      dragCircle
        .attr('cx', newPoint[0])
        .attr('cy', newPoint[1]);
      for (let i = 0; i < circles._groups[0].length; i++) {
        circle = d3.select(circles._groups[0][i]);
        newPoints.push([Number(circle.attr('cx')), Number(circle.attr('cy'))]);
      }
      poly.attr('points', newPoints);

      self.dragging = self.shapes.find(x => x.id === this.parentNode.id);
      self.dragging.points = newPoints;
      self.updateLineLabels(self.dragging, true);
      self.updateAngleLabels(self.dragging, true);
      self.updateAreaLabel(self.dragging);
    }
  }

  endDrag(self) {
    return function (d) {
      self.dragging = undefined;
    }
  }

  updateShape(shape: Shape, closed: boolean = false) {
    this.updateLineLabels(shape, closed);
    this.updateAngleLabels(shape, closed);
    this.updatePoints(shape, closed);
    this.updateAreaLabel(shape);
  }

  closePolygon(shape: Shape) {
    const svg = d3.select('svg');
    const g = this.svg.select('#' + shape.id);
    g.insert('polygon', ':first-child')
      .attr('points', shape.points)
      .style('fill-opacity', '0')
      .attr('stroke', '#000');

    g.select('polyline').remove();
    g.select('line').remove();
    this.drawing.points.splice(0, 1);
    this.updateShape(shape, true);
    this.drawing = undefined;
  }

  updateLineLabels(shape: Shape, closed: boolean = false) {
    const g = this.svg.select('#' + shape.id);
    g.selectAll('text.line-label').remove();
    let point1;
    let point2;
    for (let i = 1; i < shape.points.length; i++) {
      point1 = shape.points[i - 1];
      point2 = shape.points[i];

      this.addLineLabel(g, point1, point2);
    }
    if (closed) {
      point1 = shape.points[0];
      point2 = shape.points[shape.points.length - 1];
      this.addLineLabel(g, point1, point2);
    }
  }

  addLineLabel(g, point1, point2) {
    const midPoint = this.findMidPoint(point1, point2);
    const text = this.findLength(point1, point2);
    if (text > 0) {
      let lineClass = 'line-label';
      let label = g.insert('text', ':first-child')
        .attr('x', midPoint.x)
        .attr('y', midPoint.y)
        .attr('text-anchor', 'middle')
        .attr('class', lineClass)
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

  updatePoints(shape: Shape, closed: boolean = false) {
    const g = this.svg.select('#' + shape.id);
    g.selectAll('circle').remove();
    let pointLength = shape.points.length - 1;
    if (closed) { pointLength++ }
    for (let i = 0; i < pointLength; i++) {
      const point = shape.points[i];
      const circle = g.append('circle')
        .attr('cx', point[0])
        .attr('cy', point[1])
        .attr('r', 4)
        .attr('fill', '#FDBC07')
        .attr('stroke', '#000');
      if (closed) {
        const dragger = d3.drag()
          .on('drag', this.handleDrag(this))
          .on('end', this.endDrag(this));
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

  updateAngleLabels(shape: Shape, closed: boolean = false) {
    let A, B, C;
    const g = this.svg.select('#' + shape.id);
    g.selectAll('text.angle-label').remove();
    if (shape.points.length > 2) {
      for (let i = 0; i < shape.points.length - 2; i++) {
        A = shape.points[i];
        B = shape.points[i + 1];
        C = shape.points[i + 2];
        this.addAngleLabel(g, A, B, C);
      }
      if (closed) {
        A = shape.points[shape.points.length - 1];
        B = shape.points[0];
        C = shape.points[shape.points.length - 2];
        this.addAngleLabel(g, A, B, C);

        A = shape.points[shape.points.length - 2];
        B = shape.points[shape.points.length - 1]
        C = shape.points[0];
        this.addAngleLabel(g, A, B, C);
      }
    }
  }

  addAngleLabel(g, A, B, C) {
    const angle = this.findAngle(A, B, C);
    if (!isNaN(angle)) {
      let text = g.insert('text', ':first-child')
        .attr('x', B[0])
        .attr('y', B[1])
        .attr('text-anchor', 'middle')
        .attr('class', 'angle-label')
        .text(`${Math.round(angle * 100) / 100}\xB0`);
    }
  }

  findAngle(A, B, C) {
    var AB = Math.sqrt(Math.pow(B[0] - A[0], 2) + Math.pow(B[1] - A[1], 2));
    var BC = Math.sqrt(Math.pow(B[0] - C[0], 2) + Math.pow(B[1] - C[1], 2));
    var AC = Math.sqrt(Math.pow(C[0] - A[0], 2) + Math.pow(C[1] - A[1], 2));
    const angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    return (angle * 180) / Math.PI;
  }

  updateAreaLabel(shape: Shape) {
    const g = this.svg.select('#' + shape.id);
    g.select('text.area-label').remove();
    const polygon = g.select('polygon');
    if (!polygon.empty()) {
      const area = d3.polygonArea(shape.points);
      const centroid = d3.polygonCentroid(shape.points);
      let text = g.insert('text', ':first-child')
        .attr('x', centroid[0])
        .attr('y', centroid[1])
        .attr('text-anchor', 'middle')
        .attr("class", 'area-label')
        .text('A=' + Math.round(area * 100) / 100);
    }
  }
}
