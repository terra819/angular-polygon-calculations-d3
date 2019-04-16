import { Component, ViewChild, ElementRef } from '@angular/core';
import * as d3 from 'd3';
// import d3 from 'd3';
// http://jsfiddle.net/eZQdE/43/

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('tablePopupMenu') tablePopupMenu: ElementRef;
  points = [];
  dragging = false;
  drawing = false;
  startPoint: any;
  g: any;

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

  getRandomColor() {
    let letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  handleMouseUp(event: any) {
    if (this.dragging) return;
    this.drawing = true;
    this.startPoint = [event.offsetX, event.offsetY];
    const svg = d3.select('svg');
    if (svg.select('g.drawPoly').empty()) this.g = svg.append('g').attr('class', 'drawPoly');

    if (event.target.hasAttribute('is-handle')) {
      this.closePolygon(event);
      return;
    };
    this.points.push(this.startPoint);
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
  }

  handleMouseMove(event: any) {
    if (!this.drawing) return;
    let g = d3.select('g.drawPoly');
    g.select('line').remove();
    let line = g.insert('line', ':first-child')
      .attr('x1', this.startPoint[0])
      .attr('y1', this.startPoint[1])
      .attr('x2', event.offsetX)
      .attr('y2', event.offsetY)
      .attr('stroke', '#53DBF3')
      .attr('stroke-width', 1);
    //calculate line length
  }

  closePolygon(event: any) {
    const dragger = d3.drag()
      .on('drag', this.handleDrag)
      .on('end', function (d) {
        this.dragging = false;
      });
    const svg = d3.select('svg');
    svg.select('g.drawPoly').remove();
    const g = svg.append('g');
    g.append('polygon')
      .attr('points', this.points)
      .style('fill', this.getRandomColor());
    for (var i = 0; i < this.points.length; i++) {
      var circle = g.selectAll('circles')
        .data([this.points[i]])
        .enter()
        .append('circle')
        .attr('cx', this.points[i][0])
        .attr('cy', this.points[i][1])
        .attr('r', 4)
        .attr('fill', '#FDBC07')
        .attr('stroke', '#000')
        .attr('is-handle', 'true')
        .style("cursor", "move")
        .call(dragger);
    }
    // g.selectAll('circle')
    // // .call(dragger);

    this.points.splice(0);
    this.drawing = false;
  }
}
