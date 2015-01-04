require 'json'
require 'matrix'

def load_obj(filename)
  vertices = []
  uvs      = []
  normals  = []
  faces    = []

  current_mtl  = ""
  mtl_filename = ""

  open(filename) do |f|
    f.each_line do |line|
      line.strip!

      if line =~ /mtllib (.+)/
        mtl_filename = $1
      end

      if line =~ /v ((\-?[0-9]+\.[0-9]+ ?){3})/
        tmp = $1.split(/ /)
        vertices << [ tmp[0].to_f, tmp[1].to_f, tmp[2].to_f ]
      end

      if line =~ /vt ((\-?[0-9]+\.[0-9]+ ?){2})/
        tmp = $1.split(/ /)
        uvs << [ tmp[0].to_f, tmp[1].to_f ]
      end

      if line =~ /vn ((\-?[0-9]+\.[0-9]+ ?){3})/
        tmp = $1.split(/ /)
        normals << [ tmp[0].to_f, tmp[1].to_f, tmp[2].to_f ]
      end

      if line =~ /usemtl (.+)/
        current_mtl = $1
      end

      if line =~ /f ((([0-9]*\/?){1,3} ?){3})/
        vertex = []
        uv     = []
        normal = []
        $1.split(/ /).each do |face|
          f = face.split('/')
          vertex << f[0].to_i - 1
          uv     << f[1].to_i - 1 if f[1] && !f[1].empty?
          normal << f[2].to_i - 1 if f[2] && !f[2].empty?
        end
        faces << { vertex: vertex, uv: uv, normal: normal, mtl: current_mtl }
      end
    end
  end

  return {
    vertices: vertices,
    uvs: uvs,
    normals: normals,
    faces: faces,
    mtl: mtl_filename
  }
end

def load_mtl(filename)
  mtl = {}

  open(filename) do |f|
    current_mtl = ""
    f.each_line do |line|
      line.strip!
      next if line.empty? || line[0] == '#'

      (signature, value) = line.split(/ /, 2)

      case signature
      when 'newmtl'
        current_mtl = value
        mtl[current_mtl] = {}
      when 'Ka'
        mtl[current_mtl][:Ka] = value.split(/ /).map(&:to_f)
      when 'Kd'
        mtl[current_mtl][:Kd] = value.split(/ /).map(&:to_f)
      when 'Ns'
        mtl[current_mtl][:Ns] = value.to_f
      when 'map_Kd'
        mtl[current_mtl][:map_Kd] = value
      end
    end
  end

  return mtl
end

obj = load_obj('model.obj')
mtl = load_mtl(obj[:mtl])

uvs = []
vnormals = []
normals = []
groups = {}

old_mtl = ""
group_index = -1
obj[:faces].each_with_index do |face, i|
  face[:vertex].each_with_index do |vertex_index, index|
    uvs[vertex_index] = obj[:uvs][face[:uv][index]]
    normals[vertex_index] = obj[:normals][face[:normal][index]] unless obj[:normals].empty?
  end

  if old_mtl != face[:mtl]
    group_index += 1
  end

  if obj[:normals].empty?
    vx1 = obj[:vertices][face[:vertex][0]]
    vx2 = obj[:vertices][face[:vertex][1]]
    vx3 = obj[:vertices][face[:vertex][2]]

    v1 = Vector[vx1[0], vx1[1], vx1[2]]
    v2 = Vector[vx2[0], vx2[1], vx2[2]]
    v3 = Vector[vx3[0], vx3[1], vx3[2]]

    sv1 = v1 - v2
    sv2 = v1 - v3

    nv = sv1.cross_product(sv2)
    3.times do |index|
      if vnormals[face[:vertex][index]]
        vnormals[face[:vertex][index]] += nv
      else
        vnormals[face[:vertex][index]] = nv
      end
    end
  end

  groups[group_index] = { indices: [] } unless groups[group_index]
  groups[group_index][:indices] += face[:vertex].flatten
  groups[group_index][:mtl] = mtl[face[:mtl]]
  if mtl[face[:mtl]][:map_Kd]
    groups[group_index][:texture] = "./tex/#{File.basename(mtl[face[:mtl]][:map_Kd])}"
  end

  old_mtl = face[:mtl]
end

vnormals.each_with_index do |vnormal, index|
  normals[index] = vnormal.normalize.to_a
end

open('model.json', 'w') do |f|
  content = {
    vertices: obj[:vertices].flatten,
    tex_coord: uvs.flatten,
    normals: normals.flatten,
    groups: groups
  }
  f.puts({ obj: content }.to_json)
end
