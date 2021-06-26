'use strict';

require('source-map-support/register');
require('@asyncapi/parser');
var modelina = require('@asyncapi/modelina');
var generatorReactSdk = require('@asyncapi/generator-react-sdk');
var _ = require('lodash');
var jsxRuntime = require('react/cjs/react-jsx-runtime.production.min');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ___default = /*#__PURE__*/_interopDefaultLegacy(_);

function camelCase(string) {
  return ___default['default'].camelCase(string);
}
function pascalCase(string) {
  string = ___default['default'].camelCase(string);
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function renderGRPCType(model) {
  if (Array.isArray(model)) {
    return model.map(t => this.renderGRPCType(t)).join(' | ');
  }

  if (model.enum !== undefined) {
    return model.enum.map(value => typeof value === 'string' ? `"${value}"` : value).join(' | ');
  }

  if (model.$ref !== undefined) {
    return pascalCase(model.$ref);
  }

  if (Array.isArray(model.type)) {
    let index = 1;
    return `oneof ${pascalCase(model.$id)} { ${model.type.map(t => `${this.toGRPCType(t, model)} ${camelCase(this.toGRPCType(t, model))}Value = ${index++};`)} }`;
  }

  return toGRPCType(model.type, model);
}

function toGRPCType(type, model) {
  if (type === undefined) {
    return 'google.protobuf.Any';
  }

  switch (type) {
    case 'string':
      return 'string';

    case 'integer':
      return 'int64';

    case 'number':
      return 'double';

    case 'boolean':
      return 'bool';

    case 'array':
      {
        return `repeated ${this.renderGRPCType(model.items)}`;
      }

    default:
      return type;
  }
}
/**
 * Custom model preset to ensure property names are lower cased
 */


const preset = {
  interface: {
    async self({
      renderer,
      model
    }) {
      const propertyEntries = Object.keys(model.properties).length ? Object.entries(model.properties) : [];
      let index = 1;
      let properties = propertyEntries.map(([propName, propModel]) => {
        return `
    ${renderGRPCType(propModel)} ${camelCase(propName)} = ${index++};
        `;
      });
      return `
message ${pascalCase(renderer.model.$id)} {
  ${properties.join('\n')}
}      
      `;
    }

  }
};

async function gRPCMessages(asyncapi) {
  const typescriptGenerator = new modelina.TypeScriptGenerator({
    modelType: 'interface',
    presets: [preset]
  });
  const generatedModels = await typescriptGenerator.generate(asyncapi);
  const files = [];

  for (const generatedModel of generatedModels) {
    files.push(generatedModel.result);
  }

  return files;
}
/**
 * @typedef RenderArgument
 * @type {object}
 * @property {AsyncAPIDocument} asyncapi received from the generator.
 * @property {TemplateParameters} params received from the generator.
 */

/**
 * Function to render file.
 * 
 * @param {RenderArgument} param0 render arguments received from the generator.
 */


async function index({
  asyncapi,
  params
}) {
  let serviceRPC = [];
  const channelEntries = Object.keys(asyncapi.channels()).length ? Object.entries(asyncapi.channels()) : [];
  serviceRPC = channelEntries.map(([channelName, channel]) => {
    let rpcCallName;
    let requestMessage;
    let responseMessage;

    if (channel.hasPublish()) {
      rpcCallName = `Say${pascalCase(channelName)}`;
      requestMessage = pascalCase(channel.publish().bindings().grpc.subscribe.payload.$id);
      responseMessage = pascalCase(channel.publish().message().payload().uid());
    }

    if (channel.hasSubscribe()) {
      rpcCallName = `Say${pascalCase(channelName)}`;
      requestMessage = pascalCase(channel.subscribe().message().payload().uid());
      responseMessage = pascalCase(channel.subscribe().bindings().grpc.publish.payload.$id);
    }

    return `
rpc ${rpcCallName} (${requestMessage}) returns (${responseMessage}) {}
    `;
  });
  return /*#__PURE__*/jsxRuntime.jsx(generatorReactSdk.File, {
    name: "glee.proto",
    children: `
syntax = "proto3";

option java_multiple_files = true;
option java_package = "asyncapi.glee";
option java_outer_classname = "HelloWorldProto";
option objc_class_prefix = "HLW";

package asyncapi.glee;

// The greeting service definition.
service Glee {
  ${serviceRPC.join('')}
}

import "google/protobuf/any.proto";

${(await gRPCMessages(asyncapi)).join('')}

`
  });
}

module.exports = index;
//# sourceMappingURL=glee.proto.js.map