require 'prism'
require 'json'

module Prism
  class Node
    def to_json_hash
      {
        type: self.type,
        **self.class.fields.map{
          name = it.name
          attr = attr_to_hash(self.send(name))
          [name, attr] if attr
        }.compact.to_h,
      }
    end

    def attr_to_hash(attr)
      case attr
      when Prism::Node
        attr.to_json_hash
      when Array
        attr.map{attr_to_hash(it)}
      when Prism::Location
        nil # ignore locations
      else
        attr
      end
    end
  end
end

result = Prism.parse(ARGF.read)

if result.success?
  ast_hash = result.value.to_json_hash
  puts JSON.pretty_generate(ast_hash)
else
  puts "Parse error!"
end