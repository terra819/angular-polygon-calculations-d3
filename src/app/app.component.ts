import { Component } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  points: [] = [];
  dragging = false;
  drawing = false;
  startPoint: any;
  g: any;

  constructor() {
    let results = d3.select('#results');
    let svg = d3.select('body').append('svg')
      .attr('height', 200)
      .attr('width', 500);

    let dragger = d3.drag()
      // .on('drag', this.handleDrag(this))
      .on('end', function (d) {
        this.dragging = false;
      });
    svg.on('mouseup', function () {
      if (this.dragging) return;
      this.drawing = true;
      this.startPoint = [d3.mouse(this)[0], d3.mouse(this)[1]];
      if (svg.select('g.drawPoly').empty()) this.g = svg.append('g').attr('class', 'drawPoly');
      if (d3.event.target.hasAttribute('is-handle')) {
        closePolygon();
        return;
      };
      this.points.push(d3.mouse(this));
      this.g.select('polyline').remove();
      let polyline = this.g.append('polyline').attr('points', this.points)
        .style('fill', 'none')
        .attr('stroke', '#000');
      for (let i = 0; i < this.points.length; i++) {
        this.g.append('circle')
          .attr('cx', this.points[i][0])
          .attr('cy', this.points[i][1])
          .attr('r', 4)
          .attr('fill', 'yellow')
          .attr('stroke', '#000')
          .attr('is-handle', 'true')
          .style({ cursor: 'pointer' });
      }
    });
    function closePolygon() {
      svg.select('g.drawPoly').remove();
      let g = svg.append('g');
      g.append('polygon')
        .attr('points', this.points)
        .style('fill', this.getRandomColor());
      for (let i = 0; i < this.points.length; i++) {
        let circle = g.selectAll('circles')
          .data([this.points[i]])
          .enter()
          .append('circle')
          .attr('cx', this.points[i][0])
          .attr('cy', this.points[i][1])
          .attr('r', 4)
          .attr('fill', '#FDBC07')
          .attr('stroke', '#000')
          .attr('is-handle', 'true')
          // .style({cursor: 'move'})
          .call(dragger);
      }
      this.points.splice(0);
      this.drawing = false;
    }
    svg.on('mousemove', function () {
      if (!this.drawing) return;
      let g = d3.select('g.drawPoly');
      g.select('line').remove();
      let line = g.append('line')
        .attr('x1', this.startPoint[0])
        .attr('y1', this.startPoint[1])
        .attr('x2', d3.mouse(this)[0] + 2)
        .attr('y2', d3.mouse(this)[1])
        .attr('stroke', '#53DBF3')
        .attr('stroke-width', 1);
      //calculate line length
    })
  }

  handleDrag(dragee) {
    if (this.drawing) return;
    let dragCircle = d3.select(this), newPoints = [], circle;
    this.dragging = true;
    let poly = d3.select(dragee.parentNode).select('polygon');
    let circles = d3.select(dragee.parentNode).selectAll('circle');
    dragCircle
      .attr('cx', d3.event.x)
      .attr('cy', d3.event.y);
    for (let i = 0; i < circles[0].length; i++) {
      circle = d3.select(circles[0][i]);
      newPoints.push([circle.attr('cx'), circle.attr('cy')]);
    }
    poly.attr('points', newPoints);
  }

  getRandomColor() {
    let letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
