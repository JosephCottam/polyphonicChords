//Carved out of a custom d3 implementation by gghh
//Blog post -- http://www.gghh.name/dibtp/?p=277
//Original source repo -- https://github.com/gghh/d3

d3.layout.undirectedchord = function() {
  var π = Math.PI, τ = 2 * π, halfπ = π / 2, ε = 1e-6, ε2 = ε * ε, d3_radians = π / 180, d3_degrees = 180 / π; //Definition take from d3

  var chord = {}, chords, groups, connections, padding = 0, sortGroups, sortSubgroups, sortChords;
  function relayout() {
    var subgroups = [], groupSums = {}, subgroupIndex = [], polygons = [], poly = {
      edges: [],
      vertices: {}
    }, samebase = [], ngroups = 0, groupIndex, pt1, pt2, pt, ep, k, x, x0, i, j, h;
    chords = [];
    groups = [];
    k = 0, i = -1;
    while (++i < connections.length) {
      j = -1;
      while (++j < connections[i].length) {
        ep = connections[i][j].group;
        if (ep in groupSums) {
          groupSums[ep] += connections[i][j].value;
        } else {
          groupSums[ep] = connections[i][j].value;
          ++ngroups;
        }
        k += connections[i][j].value;
      }
    }
    groupIndex = d3.range(ngroups);
    if (sortGroups) {
      groupIndex.sort(function(a, b) {
        return sortGroups(groupSums[a], groupSums[b]);
      });
    }
    k = (2 * π - padding * ngroups) / k;
    i = -1;
    while (++i < connections.length) {
      if (connections[i].length > 1) {
        j = 0;
        while (++j < connections[i].length) {
          poly.edges.push({
            source: connections[i][j - 1],
            target: connections[i][j]
          });
          poly.vertices[connections[i][j - 1].group + ""] = "";
        }
        poly.vertices[connections[i][j - 1].group + ""] = "";
        if (poly.edges.length > 1) {
          poly.edges.push({
            source: connections[i][0],
            target: connections[i][j - 1]
          });
        }
        polygons.push(poly);
        poly = {
          edges: [],
          vertices: {}
        };
      }
    }
    i = -1;
    while (++i < ngroups) {
      subgroups[i] = [];
      j = -1;
      while (++j < polygons.length) {
        samebase = {
          ribbons: [],
          basevalue: 0
        };
        h = -1;
        while (++h < polygons[j].edges.length) {
          if (polygons[j].edges[h].source.group === i) {
            samebase.ribbons.push(polygons[j].edges[h]);
            samebase.basevalue = polygons[j].edges[h].source.value;
          } else if (polygons[j].edges[h].target.group === i) {
            samebase.ribbons.push(polygons[j].edges[h]);
            samebase.basevalue = polygons[j].edges[h].target.value;
          }
        }
        subgroups[i].push(samebase);
      }
    }
    i = -1;
    while (++i < connections.length) {
      if (connections[i].length === 1) {
        subgroups[connections[i][0].group].push({
          ribbons: [],
          basevalue: connections[i][0].value
        });
      }
    }
    i = -1;
    while (++i < ngroups) {
      subgroupIndex.push(d3.range(subgroups[i].length));
    }
    if (sortSubgroups) {
      subgroupIndex.forEach(function(d, i) {
        d.sort(function(a, b) {
          return sortSubgroups(subgroups[i][a], subgroups[i][b],i);
        });
      });
    }
    x = 0, i = -1;
    while (++i < ngroups) {
      var di = groupIndex[i];
      x0 = x, j = -1;
      while (++j < subgroupIndex[di].length) {
        var dj = subgroupIndex[di][j], v = subgroups[di][dj].basevalue, a0 = x, a1 = x += v * k;
        h = -1;
        while (++h < subgroups[di][dj].ribbons.length) {
          pt1 = subgroups[di][dj].ribbons[h].source;
          pt2 = subgroups[di][dj].ribbons[h].target;
          if (pt1.group === di) {
            pt = pt1;
          } else {
            pt = pt2;
          }
          pt["geometry"] = {
            index: di,
            subindex: dj,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
      }
      groups[di] = {
        index: di,
        startAngle: x0,
        endAngle: x,
        value: (x - x0) / k
      };
      x += padding;
    }
    i = -1;
    while (++i < polygons.length) {
      j = -1;
      while (++j < polygons[i].edges.length) {
        var source = polygons[i].edges[j].source.geometry, target = polygons[i].edges[j].target.geometry;
        if (source.value || target.value) {
          chords.push(source.value < target.value ? {
            source: target,
            target: source,
            groups: polygons[i].vertices
          } : {
            source: source,
            target: target,
            groups: polygons[i].vertices
          });
        }
      }
    }
    if (sortChords) resort();
  }
  function resort() {
    chords.sort(function(a, b) {
      return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
    });
  }
  chord.connections = function(x) {
    if (!arguments.length) return connections;
    connections = x;
    chords = groups = null;
    return chord;
  };
  chord.padding = function(x) {
    if (!arguments.length) return padding;
    padding = x;
    chords = groups = null;
    return chord;
  };
  chord.sortGroups = function(x) {
    if (!arguments.length) return sortGroups;
    sortGroups = x;
    chords = groups = null;
    return chord;
  };
  chord.sortSubgroups = function(x) {
    if (!arguments.length) return sortSubgroups;
    sortSubgroups = x;
    chords = null;
    return chord;
  };
  chord.sortChords = function(x) {
    if (!arguments.length) return sortChords;
    sortChords = x;
    if (chords) resort();
    return chord;
  };
  chord.chords = function() {
    if (!chords) relayout();
    return chords;
  };
  chord.groups = function() {
    if (!groups) relayout();
    return groups;
  };
  return chord;
};
