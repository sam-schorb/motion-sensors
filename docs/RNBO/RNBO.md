Getting the RNBO.js library
How to include the rnbo.js library in your JavaScript or TypeScript project.

In order to use an exported RNBO patcher in a web page, you'll need to include the rnbo.js adapter library. This library wraps the exported code itself, providing an API that facilitates integration with WebAudio.

Loading via our CDN
There are two ways to include the rnbo.js library. First, you can simply load the library from our public CDN (Content delivery network).

<!-- Add this somewhere in your header. -->
<script type="text/javascript" src="https://cdn.cycling74.com/rnbo/latest/rnbo.min.js"></script>

If you add RNBO to your page this way, the library will add a global RNBO object to your window. You can call into the library using this global object.

const device = await RNBO.createDevice({ audioContext, patcher });
npm install
If you're working with RNBO in a npm package, you can also install @rnbo/js using npm.

npm install @rnbo/js
And then include the library in your code, for example with the require() or import syntax.

import { createDevice } from "@rnbo/js";
You can also use @rnbo/js in TypeScript projects. For more details see Working with TypeScript.

const { createDevice } = require("@rnbo/js");
//...
const device = await createDevice({ audioContext, patcher });
Note: For consistency, code examples in this documentation will use this second strategy, and will not call into the adapter library using the global RNBO object. However, it's generally very easy to convert from using require or import to the CDN-style include.

// This require style syntax...
const { createDevice } = require("@rnbo.js");

// ...can easily be converted to work with a CDN link, assuming a global RNBO object
const { createDevice } = RNBO;

// In both cases, the createDevice function can now be used without the RNBO prefix
RNBO.js Version
If you try to use a version of the library that doesn't match the version of RNBO that you exported with, you'll see an error appear in the developer console of your browser.

Screen Shot 2022-07-13 at 5.35.43 PM.png
As the error suggests, it's not necessarily a fatal error, but a version mismatch could cause problems.

Working with Web Audio Contexts
In order to play audio in the browser, you need to create a WebAudio AudioContext.

In order to play audio in the browser, you need to create a WebAudio AudioContext. The AudioContext is responsible for managing audio processing, as well as creating and connecting the AudioNodes that define the audio processing graph. A RNBO device will need access to an AudioContext in order to process audio, and will need to be connected to an input and output node in order to receive audio from an audio input device and send it to an audio output device.

// Some browsers may use an older version of WebKit as their browser engine, and may implement the WebAudio specification using webkitAudioContext instead of AudioContext. This line of code accounts for both.
let WAContext = window.AudioContext || window.webkitAudioContext;
let context = new WAContext();
Importantly, an AudioContext must be resumed before it will start processing audio. It's only possible to resume an AudioContext from a user-initiated event, like clicking on a button or pressing a key.

let button = document.getElementById("some-button");
button.onpointerdown = () => { context.resume() };
If at some point you expect to hear audio but don't, one of the first things to check is your browser's developer console. If you see a message like The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page., then it's likely that you need to remember to call resume on your audio context in some user-initiated context.

The AudioContext will always have a destination that you can connect other audio processing nodes to. Once you've created a RNBO device, you can get its node and connect to the AudioContext destination in order to get sound out of RNBO.

// Optionally, you can create a gain node to control the level of your RNBO device
const gainNode = context.createGain();
gainNode.connect(context.destination);
// Assuming you've created a device already, you can connect its node to other web audio nodes
device.node.connect(gainNode);
// This connects the RNBO device to the gain node, which is connected to audio output. Now sound
// coming from the RNBO device should reach the speakers.
In order to receive audio input, you'll first need to create an input node from a media stream. This can be done using the getUserMedia function with a callback that connects to your RNBO device.

// Assuming you have a RNBO device already, and an audio context as well
const handleSuccess = (stream) => {
const source = context.createMediaStreamSource(stream);
source.connect(device.node);
}
navigator.mediaDevices.getUserMedia({ audio: true, video: false })
.then(handleSuccess);

    Loading a RNBO Device in the Browser

Now that we know how to create an AudioContext, we're ready to go about creating a RNBO device.

Now that we know how to create an AudioContext, we're ready to go about creating a RNBO device. As a prerequisite, we should make sure that the page we want to run RNBO in is being served, and not simply loaded from a file:// URL. In other words, if you just double-click a .html file to open it in the browser, your RNBO device will fail to load (see https://github.com/Cycling74/rnbo.example.webpage for more information). For security reasons, the browser will not enable WebAssembly or AudioWorklets for any page loaded with a file:// URL scheme. Without these two browser technologies, RNBO can't load.

If you're looking for a simple way to start an HTTP server on your machine, and you have Node installed, you can launch a static HTTP server from the command line by running npx http-server.

Assuming you've exported your patcher to a file patcher.export.json, you can use fetch to get the contents of the file. Then, parse the raw contents as JSON and pass the result to RNBO.createDevice. Note that this relies on asynchronous JavaScript functions, so we have to be careful to await these asynchronous functions.

// Get createDevice from the rnbo.js library
const { createDevice } = require("@rnbo/js");

// Create AudioContext
let WAContext = window.AudioContext || window.webkitAudioContext;
let context = new WAContext();

const setup = async () => {
let rawPatcher = await fetch("patcher.export.json");
let patcher = await rawPatcher.json();

    let device = await createDevice({ context, patcher });

    // This connects the device to audio output, but you may still need to call context.resume()
    // from a user-initiated function.
    device.node.connect(context.destination);

};

// We can't await an asynchronous function at the top level, so we create an asynchronous
// function setup, and then call it without waiting for the result.
setup();

Getting and Setting Parameters
A Device gives you access to its parameters by using the .parameters property, which will return an array of Parameter objects.

A Device gives you access to its parameters by using the .parameters property, which will return an array of Parameter objects. You can read and update the values of each parameter in this array. Each parameter corresponds to a param object in rnbo~.

// Print the names of all the top-level parameters in the device.
device.parameters.forEach(parameter => {
// Each parameter has an ID as well as a name. The ID will include
// the full path to the parameter, including the names of any parent
// patchers if the parameter is in a subpatcher. So if the path contains
// any "/" characters, you know that it's not a top level parameter.

    // Uncomment this line to include only top level parameters.
    // if (parameter.id.includes("/")) return;

    console.log(parameter.id);
    console.log(parameter.name);

});
You can also access parameters sorted by id using the parametersById property.

Changing Parameter Values
All parameters have a value property that can be used to set and get the parameter value. So in order to set the value of a parameter in your Device, simply store the parameter in a new variable and set its value.

// param is of type Parameter
const param = device.parametersById.get("my_param");
param.value = 1;
Based on the type of Parameter there might be additional ways to alter its value. For example, a NumberParameter allows you to set the value as a normalizedValue in a range from (0-1) while an EnumParameter allows you to set the enumValue in addition to setting the value by index.

// here, nParam is of type NumberParameter
const nParam = device.parametersById.get("my_number_param");
console.log(nParam.min, nParam.max); // => 0, 10

nParam.normalizedValue = 0.2;
console.log(nParam.value); // => 2

nParam.value = 5;
console.log(nParam.normalizedValue); // => 0.5

// here, eParam is of type EnumParameter
const eParam = device.parametersById.get("my_enum_param");
console.log(eParam.enumValues); // => [2, 4, 8, 16];

eParam.enumValue = 16;
console.log(eParam.value); // => 3

eParam.value = 2;
console.log(eParam.enumValue); // => 8
Listening to Parameter Changes
The simplest way to register ParameterChange events is by listening to the top-level EventSubject on your device.

device.parameterChangeEvent.subscribe((param) => {
// Called when param is updated / changed
});
Additionally, each parameter supports a changeEvent that emits when the value of the parameter changes.

// here, the type of the value is dependent on the type of the parameter
const param = device.parametersById.get("my_number_param");
param.changeEvent.subscribe((value) => {
// Handle events here
});
Parameter Event Notification Levels
When creating a RNBO device, the parameterNotificationSetting option determines whether the device will post a notification due to value changes that are internal, external, or both. An external value change is one that comes from host code—in other words, the code that you write around your exported RNBO device. In general, these will be changes that look like param.value = <value>;. An internal value change is one that comes from the device itself.

const device = await createDevice({
context: audioContext,
options: {
parameterNotificationSetting: ParameterNotificationSetting.All // also the default value
}
patcher: patcher
});

// Let's assume this exists in our patcher
const param = device.parametersById.get("my_number_param");

// With ParameterNotificationSetting.All, the device AND the parameter emit an event when we change the value
param.changeEvent.subscribe((v) => {
console.log(`ChangeEvent: ${v}`);
});

device.parameterChangeEvent.subscribe((v) => {
console.log(`ParameterChangeEvent: ${v}`);
});

// Change the value
param.value = 2;
// => both listeners will be called
// "ChangeEvent: 2" and "ParameterChangeEvent: 2" will be printed to the console

// Disable events for value changes from the "outside"
device.parameterNotificationSetting = ParameterNotificationSetting.Internal;

// Change the value
param.value = 3;
// No listener will be called. We will only get events when the device updates / corrects the value internally
Note that redundantly setting the value of a parameter will never trigger any of the aforementioned events.

param.value = 3; // triggers events with ParameterNotificationSetting.All as the option
param.value = 3; // will not trigger an event as we did not actually change the value
The API Documentation for all available options can be found here.

Parameter Scaling and Normalization
All RNBO parameters have a value and normalizedValue property. These properties allow you to get and set the values of a given parameter. The normalizedValue property uses a range between 0 and 1. Setting the normalizedValue of a parameter to 0 will set the parameter to its minimum value, and setting it to 1 will set the parameter to its maximum value.

Normalized RNBO parameters may utilize nonlinear scaling, either through a simple exponent or through a custom normalization expression as defined in the original RNBO patcher. If you want to use the normalization function bound to a parameter, the parameter class has two functions that you can use to convert to and from a normalized value.

- convertToNormalizedValue - A function to convert a real value to its normalized representation

- convertFromNormalizedValue - A function to convert a normalized value to its real counterpart

Sending and Receiving Messages (Inlets + Outlets)
@rnbo/js exposes the MessageEvent class, which you can use to send messages to your RNBO patcher. This includes support for the inport/outport RNBO objects, as well as RNBO inlets and outlets.

@rnbo/js exposes the MessageEvent class, which you can use to send messages to your RNBO patcher. This includes support for the inport/outport RNBO objects, as well as RNBO inlets and outlets.

const { TimeNow, MessageEvent } = require("@rnbo/js")

// Sends the number 74 to the first inlet
// All inlets have a tag with the form "in$", where $ is the index of the inlet (starting at 1)
const event1 = new MessageEvent(TimeNow, "in1", [ 74 ]);
device.scheduleEvent(event1);

// Sends the number 75 to an inport labeled "dest"
const event2 = new MessageEvent(TimeNow, "dest", [ 75 ]);
device.scheduleEvent(event2);
Getting Events from your RNBO Patch
A RNBO Device uses an EventSubject for its emitted events. You can subscribe to the messageEvent property of a RNBO device to bind a function that will be called whenever the RNBO device produces a message event. Messages sent to an outport will have a tag based on that outport, whereas messages sent to an outlet will have a tag of the form "out$", where $ is the index of the outlet (starting at 1). See the example below on how to subscribe to outgoing events. Visit the JS API Reference for more information about the MessageEvent class.

// ev is of type MessageEvent, which has a tag and a payload
device.messageEvent.subscribe((ev) => {
console.log(`Received message ${ev.tag}: ${ev.payload}`);

    if (ev.tag === "out1") console.log("from the first outlet");

});

Working with Multiple RNBO Devices
The WebAudio API is designed around the concept of audio processing nodes. Each of these nodes can have zero or more audio inputs, as well as zero or more audio outputs.

The WebAudio API is designed around the concept of audio processing nodes. Each of these nodes can have zero or more audio inputs, as well as zero or more audio outputs. When we create a RNBO device, we also create a WebAudio node that wraps the exported RNBO code. This makes it easy to use multiple RNBO devices together in an audio processing chain.

// This code assumes that we have two RNBO patches, one exported as synth.export.json,
// and one exported as effect.export.json
const { createDevice } = require ("@rnbo/js");

async function setup() {
const WAContext = window.AudioContext || window.webkitAudioContext;
const context = new WAContext();

    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);

    // Fetch the exported patchers
    let response = await fetch("export/synth.export.json");
    const synthPatcher = await response.json();
    response = await fetch("export/effect.export.json");
    const effectPatcher = await response.json();

    // Create the devices
    const synthDevice = await createDevice({ context, patcher: synthPatcher });
    const effectDevice = await createDevice({ context, patcher: effectPatcher });

    // Connect the devices in series
    synthDevice.node.connect(effectDevice.node);
    effectDevice.node.connect(outputNode);

}

setup();
Splitting and Merging Audio Channels
As mentioned, a WebAudio node can have multiple input and output channels. The node property of a RNBO device has as many input channels as the exported RNBO patcher has in~ indexes, and as many output channels as the patcher has out~ indexes. The connect method of a WebAudio node has two optional arguments, one for the output index and one for the input index. Using these arguments, one could take a monophonic RNBO device and pass it through a stereo effect.

// Create the devices
const synthDevice = await createDevice({ context, patcher: synthPatcher });
const effectDevice = await createDevice({ context, patcher: effectPatcher });

// Diffuse the monophonic output of the synthesizer into stereo
synthDevice.node.connect(effectDevice.node, 0, 0);
synthDevice.node.connect(effectDevice.node, 0, 1);
effectDevice.node.connect(outputNode);
For more information, check the API documentation for AudioNode, and the documentation for the AudioContext functions createChannelSplitter and createChannelMerger.
