import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Download, Image as ImageIcon, FileCode } from 'lucide-react';

interface D3VisualizerProps {
  config: {
    type: 'bar' | 'line' | 'scatter' | 'pie';
    data: any[];
    options?: {
      xKey?: string;
      yKey?: string;
      labelKey?: string;
      valueKey?: string;
      title?: string;
      xLabel?: string;
      yLabel?: string;
    };
  };
}

export default function D3Visualizer({ config }: D3VisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !config.data || config.data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 300;
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    if (config.options?.title) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(config.options.title);
    }

    if (config.type === 'bar') {
      const xKey = config.options?.xKey || 'label';
      const yKey = config.options?.yKey || 'value';

      const x = d3.scaleBand()
        .domain(config.data.map(d => d[xKey]))
        .range([0, chartWidth])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(config.data, d => d[yKey]) as number])
        .nice()
        .range([chartHeight, 0]);

      g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('fill', '#888')
        .attr('font-size', '10px');

      g.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', '#888')
        .attr('font-size', '10px');

      g.selectAll('.bar')
        .data(config.data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d[xKey]) as number)
        .attr('y', d => y(d[yKey]))
        .attr('width', x.bandwidth())
        .attr('height', d => chartHeight - y(d[yKey]))
        .attr('fill', '#10b981')
        .attr('rx', 4);

    } else if (config.type === 'line') {
      const xKey = config.options?.xKey || 'x';
      const yKey = config.options?.yKey || 'y';

      const x = d3.scalePoint()
        .domain(config.data.map(d => d[xKey]))
        .range([0, chartWidth]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(config.data, d => d[yKey]) as number])
        .nice()
        .range([chartHeight, 0]);

      g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('fill', '#888')
        .attr('font-size', '10px');

      g.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', '#888')
        .attr('font-size', '10px');

      const line = d3.line<any>()
        .x(d => x(d[xKey]) as number)
        .y(d => y(d[yKey]))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(config.data)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2)
        .attr('d', line);

      g.selectAll('.dot')
        .data(config.data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d[xKey]) as number)
        .attr('cy', d => y(d[yKey]))
        .attr('r', 4)
        .attr('fill', '#10b981');

    } else if (config.type === 'scatter') {
      const xKey = config.options?.xKey || 'x';
      const yKey = config.options?.yKey || 'y';

      const x = d3.scaleLinear()
        .domain([0, d3.max(config.data, d => d[xKey]) as number])
        .nice()
        .range([0, chartWidth]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(config.data, d => d[yKey]) as number])
        .nice()
        .range([chartHeight, 0]);

      g.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('fill', '#888')
        .attr('font-size', '10px');

      g.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('fill', '#888')
        .attr('font-size', '10px');

      g.selectAll('circle')
        .data(config.data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d[xKey]))
        .attr('cy', d => y(d[yKey]))
        .attr('r', 5)
        .attr('fill', '#10b981')
        .attr('opacity', 0.7);

    } else if (config.type === 'pie') {
      const labelKey = config.options?.labelKey || 'label';
      const valueKey = config.options?.valueKey || 'value';

      const radius = Math.min(chartWidth, chartHeight) / 2;
      const pieG = g.append('g')
        .attr('transform', `translate(${chartWidth / 2},${chartHeight / 2})`);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const pie = d3.pie<any>().value(d => d[valueKey]);
      const arc = d3.arc<any>().innerRadius(0).outerRadius(radius);

      const arcs = pieG.selectAll('.arc')
        .data(pie(config.data))
        .enter()
        .append('g')
        .attr('class', 'arc');

      arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i.toString()));

      arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .text(d => d.data[labelKey]);
    }

    // Axis labels
    if (config.options?.xLabel) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#888')
        .attr('font-size', '10px')
        .text(config.options.xLabel);
    }

    if (config.options?.yLabel) {
      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#888')
        .attr('font-size', '10px')
        .text(config.options.yLabel);
    }

    // Styling axes
    svg.selectAll('.domain').attr('stroke', '#333');
    svg.selectAll('.tick line').attr('stroke', '#333');

  }, [config]);

  const exportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexucore-viz-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    if (!svgRef.current) return;
    
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Use a higher resolution for the export
    const exportWidth = 1500;
    const exportHeight = 900;
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      if (ctx) {
        // Draw background
        ctx.fillStyle = '#09090b'; // zinc-950
        ctx.fillRect(0, 0, exportWidth, exportHeight);
        
        // Draw SVG
        ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
        
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `nexucore-viz-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 my-4 group relative">
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={exportSVG}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all shadow-xl"
          title="Export as SVG"
        >
          <FileCode className="w-4 h-4" />
        </button>
        <button
          onClick={exportPNG}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all shadow-xl"
          title="Export as PNG"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>
      <svg ref={svgRef} className="w-full h-auto max-w-full"></svg>
    </div>
  );
}
