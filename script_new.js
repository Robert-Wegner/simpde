
Str = (j) => String(j);
StrF = (j) => j.toFixed(1);

var defaultEquation = `u_tt = u_laplace * Delta_u \n - u_identity * u \n - u_derivative * u_t \n - u_cubic * u * u * u \n + u_noise * noise \n + force;`,


defaultMultiValuedEquation = (n) => [...Array(n).keys()].map((j) => 
        `u_` + Str(j+1) + `_tt = `
        + `u_laplace * Delta_u_` + Str(j+1) + ` \n`
        + ` - u_identity * u_` + Str(j+1) + ` \n`
        + ` - u_derivative * u_` + Str(j+1) + `_t \n`
        + `- u_cubic * u_` + Str(j+1) + ` * u_` + Str(j+1) + ` * u_` + Str(j+1) + ` \n`
        + ` + u_noise * noise_` + Str(j+1) + ` \n`
        + `+ force; \n #`).join("")


/*
defaultMultiValuedEquation = (n) => [...Array(n).keys()].map((j) => 
    `\n` + `u_` + Str(j+1) + ` = ` + StrF(j+1) + ` * 0.2; \n #`).join("");
*/

var startValueDimensions = 2;
var settings =  { 
    width: 600,
    height: 600,
    laplacian: 1.0,
    cubic: 1.0,
    identity: 1.0,
    derivative: 1.0,
    noise: 1.0,
    defaultLaplacian: 1.0,
    defaultCubic: 1.0,
    defaultIdentity: 1.0,
    defaultDerivative: 1.0,
    defaultNoise: 1.0,
    inputStrength: 5.0,
    inputRadius: 30,
    colorSensitivity: 50.0,
    colorMixRatio: 0.13,
    colorExponent: 1.0,
    colorMixExponent: 1.0,
    colorCap: 0.98,
    colorPattern: 0,
    scaleX: 1.0,
    scaleY: 1.0,
    scaleT: 0.03,
    maxVal: 100000.0,
    speed: 1,
    delay: 6,
    boundaryCondition: 1,
    valueDimensions: startValueDimensions,
    useCustomEquation: false,
    equation: "#\n" + defaultMultiValuedEquation(startValueDimensions),
    displayedQuantity: "[" + [...Array(startValueDimensions).keys()].map((j) => "`u_" + Str(j+1) + "`").join(", ") + "]",
    initialDataFunction: "(x,y) => [[0.0,0.0], [0.0,0.0]]",
    useCellularAutomatonRule: ""
    };

var inputSettingsJSON = document.getElementById("settingsJSON");

window.onload = main;

function main() {

    var terminate = 0;
    if (window.location.hash) {
        //console.log("yes", window.location.hash, window.location.hash.length)
        settings = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
    }
    else {
        //console.log("else")
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
    }

    inputSettingsJSON.value = JSON.stringify(settings, null, 2);
    inputSettingsJSON.onchange = function(event) {
        settings = JSON.parse(event.target.value);
        document.getElementById("width").value = settings.width;
        document.getElementById("height").value = settings.height;
        document.getElementById("delay").value = settings.delay;
        document.getElementById("inputRadius").value = settings.inputRadius;
        document.getElementById("inputStrength").value = settings.inputStrength;
        document.getElementById("scaleT").value = settings.scaleT;
        document.getElementById("scaleXY").value = settings.scaleX;
        document.getElementById("speed").value = settings.speed;
        document.getElementById("equation").value = settings.equation;
        document.getElementById("displayedQuantity").value = settings.displayedQuantity;
        document.getElementById("useCustomEquation").checked = settings.useCustomEquation;
        document.getElementById("equation").disabled = settings.useCustomEquation ? false : true;
        document.getElementById("displayedQuantity").disabled = settings.useCustomEquation ? false : true;
        document.getElementById("initialDataFunction").value = settings.initialDataFunction;
        document.getElementById("useCellularAutomatonRule").value = settings.useCellularAutomatonRule;
        document.getElementById("laplacian").value = settings.laplacian;
        document.getElementById("identity").value = settings.identity;
        document.getElementById("derivative").value = settings.derivative;
        document.getElementById("cubic").value = settings.cubic;
        document.getElementById("noise").value = settings.noise;
        document.getElementById("boundaryCondition").value = settings.boundaryCondition;
        document.getElementById("valueDimensions").value = settings.valueDimensions;
        document.getElementById("colorSensitivity").value = settings.colorSensitivity;
        document.getElementById("colorMixRatio").value = settings.colorMixRatio;
        document.getElementById("colorExponent").value = settings.colorExponent;
        document.getElementById("colorMixExponent").value = settings.colorMixExponent;
        document.getElementById("colorCap").value = settings.colorCap;
        document.getElementById("colorPattern").value = settings.colorPattern;



        terminate = launcher(terminate);
    }

    var inputInputRadius = document.getElementById("inputRadius");
    inputInputRadius.value = settings.inputRadius;
    inputInputRadius.onchange = function(event) {
        settings.inputRadius = parseInt(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        terminate = launcher(terminate);
    }
    var inputWidth = document.getElementById("width");
    inputWidth.value = settings.width;
    inputWidth.onchange = function(event) {
        settings.width = parseInt(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        terminate = launcher(terminate);
    }
    var inputHeight = document.getElementById("height");
    inputHeight.value = settings.height;
    inputHeight.onchange = function(event) {
        settings.height = parseInt(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        terminate = launcher(terminate);
    }

    var inputValueDimensions = document.getElementById("valueDimensions");
    inputValueDimensions.value = settings.valueDimensions;
    inputValueDimensions.onchange = function(event) {
        settings.valueDimensions = parseInt(event.target.value);
        console.log(settings.valueDimensions);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));

        terminate = launcher(terminate);
    }

    var inputDelay = document.getElementById("delay");
    inputDelay.value = settings.delay;
    inputDelay.onchange = function(event) {
        settings.delay = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        terminate = launcher(terminate);
    }
    var inputReset = document.getElementById("reset");
    inputReset.onclick = function(event) {
        terminate = launcher(terminate);
    }
    inputReset.ontouchdown = function(event) {
        terminate = launcher(terminate);
    }
    var inputEquation = document.getElementById("equation");
    inputEquation.value = settings.equation;
    inputEquation.onchange = function(event) {
        settings.equation = event.target.value;
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        terminate = launcher(terminate);
    }
    var inputDisplayedQuantity = document.getElementById("displayedQuantity");
    inputDisplayedQuantity.value = settings.displayedQuantity;
    inputDisplayedQuantity.disabled = true;
    inputDisplayedQuantity.onchange = function(event) {
        settings.displayedQuantity = event.target.value;
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        terminate = launcher(terminate);
    }
    var inputUseCustomEquation = document.getElementById("useCustomEquation");
    inputUseCustomEquation.checked = false;
    inputEquation.disabled = true;
    inputUseCustomEquation.onchange = function(event) {
        settings.useCustomEquation = event.target.checked;
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        inputEquation.disabled = (event.target.checked) ? false : true;
        inputDisplayedQuantity.disabled = (event.target.checked) ? false : true;
        terminate = launcher(terminate);
    }
    var inputInitialDataFunction = document.getElementById("initialDataFunction");
    inputInitialDataFunction.value = settings.initialDataFunction;
    inputInitialDataFunction.onchange = function(event) {
        settings.initialDataFunction = event.target.value;
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        terminate = launcher(terminate);
    }
    var inputUseCellularAutomatonRule = document.getElementById("useCellularAutomatonRule");
    inputUseCellularAutomatonRule.value = settings.useCellularAutomatonRule;
    inputUseCellularAutomatonRule.onchange = function(event) {
        settings.useCellularAutomatonRule = event.target.value;
        settings.equation = generateCellularAutomaton(settings.useCellularAutomatonRule);
        inputEquation.value = settings.equation;
        settings.valueDimensions = 1;
        inputValueDimensions.value = 1;
        settings.useCustomEquation = true;
        inputUseCustomEquation.checked = true;
        inputEquation.disabled = false;
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        terminate = launcher(terminate);
    }


    var launcher = function(terminate){
        clearInterval(terminate);
        var gl = canvas.getContext("webgl2");

        if (!gl) {
            console.log('your browser/OS/drivers do not support WebGL2');
        } else {
            console.log('webgl2 works!');
        }
        gl.getExtension( 'EXT_color_buffer_float' );    

        /*
        var options = {mimeType: 'video/webm;codecs=H264', 
        videoBitsPerSecond : 4*1024*1024, width: canvas.width, height: canvas.height};

        var mediaRecorder = new MediaRecorder(canvas.captureStream(), options);

        // Set up an event listener for when the MediaRecorder starts recording
        mediaRecorder.ondataavailable = function(e) {
            // Get the recorded data as a Blob
            var videoBlob = e.data;

            // Create a URL for the videoBlob
            var videoUrl = URL.createObjectURL(videoBlob);

            // Create a link to download the video
            var downloadLink = document.createElement("a");
            downloadLink.href = videoUrl;
            downloadLink.download = "webgl2_output.webm";

            // Add the link to the document
            document.body.appendChild(downloadLink);

            // Click the link to start the download
            downloadLink.click();
        };
        // Start recording
        mediaRecorder.start();

        // Stop recording and save the video after 5 seconds
        setTimeout(function() {
            mediaRecorder.stop();
        }, 80000);

        */

        var terminate = launch(gl);
        return terminate;

    }

    var terminate = launcher(terminate);

}

function launch(gl) {
    var body = document.getElementsByTagName("body")[0];
    var canvas = document.getElementById("canvas");


    canvas.width = settings.width;
    canvas.height = settings.height;

    var width = settings.width;
    var height = settings.height;
    
    var rect = canvas.getBoundingClientRect();
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    /*
    var floatTextures = gl.getExtension('OES_texture_float');
    if (!floatTextures) {
        alert('no floating point texture support');
        return;
    }
    */
    


    // build the vertex shader

    var vertexShaderSource = `
    precision highp float;
    attribute vec2 a_position;

    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;

    uniform vec2 u_resolution;
    uniform float u_flipY;
    
    void main() {
       // convert the rectangle from pixels to 0.0 to 1.0
       vec2 zeroToOne = a_position / u_resolution;
    
       // convert from 0->1 to 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;
    
       // convert from 0->2 to -1->+1 (clipspace)
       vec2 clipSpace = zeroToTwo - 1.0;
    
       gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);
    
       // pass the texCoord to the fragment shader
       // The GPU will interpolate this value between points.
       v_texCoord = a_texCoord;
    }`;

    var fragmentShaderColorSource = `

    #define PI radians(180.0)

    precision highp float;
            
    varying vec2 v_texCoord;

    // our texture
    uniform sampler2D u_image_color;

    uniform float u_colorSensitivity;
    uniform float u_colorMixRatio;
    uniform float u_colorCap;
    uniform int u_colorPattern;
    uniform float u_maxVal_color;
    uniform float u_colorExponent;
    uniform float u_colorMixExponent;
    
    // the texCoords passed in from the vertex shader.

    
    vec2 modulo(vec2 X, vec2 Y) {
        return vec2(X - floor(X / Y) * Y);
    }

    float moduloF(float X, float Y) {
        return X - floor(X / Y) * Y;
    }

    float atan2(float x, float y)
    {
        if (abs(x) > abs(y)) {
            return atan(y, x);
        }
        else {
            return PI / 2.0 - atan(x, y);
        }
    }

    vec4 colorCurve(float phase) {

        float rad = 1.0 / sin(PI/6.0) * cos(PI/3.0) 
                        / cos(moduloF(phase+PI/4.0, 2.0*PI/3.0) - PI/3.0);

        float a = atan(sqrt(2.0));

        float q = cos(phase)*(1.0 + u_colorMixRatio*(rad - 1.0));
        float p = sin(phase)*(1.0 + u_colorMixRatio*(rad - 1.0));

        float cr = 1.0/3.0 + 1.0/sqrt(6.0) * (
            0.5 * q * (1.0 - cos(a))
            + 0.5 * p * (1.0 + cos(a))
        );
        float cg = 1.0/3.0 - 1.0/sqrt(6.0) * (
            0.5 * q * (1.0 + cos(a))
            + 0.5 * p * (1.0 - cos(a))
        );
        float cb = 1.0/3.0 + 1.0/sqrt(6.0) * (
            1.0 / sqrt(2.0) * (q - p) * sin(a)
        );

        float rescaling = 1.0 / pow(max(max(cr, cg), cb), u_colorMixExponent);
        return vec4(rescaling*cr, rescaling*cg, rescaling*cb, 1.0) ;
    }

    void main() {

        float height = ` + Str(1 / settings.valueDimensions) + `;
        int j = int(floor(v_texCoord.y / height));
        int rev_j = ` + Str(settings.valueDimensions-1) + ` - j;

        int isComplex = 0;
        
        vec4 data = texture2D(u_image_color, v_texCoord);

        vec4 color = vec4(0.5, 0.5, 0.5, 1.0);
        `
        
        +
        [...Array(settings.valueDimensions).keys()].map((j) =>
            `
            if (rev_j == ` + Str(j) + `) {
                `
                +
                ((eval(settings.displayedQuantity)[j].substring(0,2) === "1i") ?
                `isComplex = 1;`
                :
                `isComplex = 0;`)
                +
                `
                
            }`
        ).join("")
        +
        `
        if (isComplex == 0) {
            float u_raw = data.a;
            float u = sign(u_raw) * pow(u_colorSensitivity * abs(u_raw),u_colorExponent);
            float v = sign(u) * pow(u_colorMixRatio * abs(u),u_colorMixExponent);

            if (u_colorPattern == 0) {
                if (u >= 0.0) {
                    color = vec4(   (1.0 - u_colorCap * (1.0 / (1.0 + u))),
                                    (1.0 - u_colorCap * (1.0 / (1.0 + v))),
                                    1.0 - u_colorCap,
                                    1.0);
                }
                if (u < 0.0) {
                    color = vec4(   1.0 - u_colorCap, 
                                    (1.0 - u_colorCap * (1.0 / (1.0 - v))),
                                    (1.0 - u_colorCap * (1.0 / (1.0 - u))),
                                    1.0);
                }
            }
            else if (u_colorPattern == 1) {
                if (u >= 0.0) {
                    color = vec4(   1.0 - u_colorCap,
                                    (1.0 - u_colorCap * (1.0 / (1.0 + u))),
                                    (1.0 - u_colorCap * (1.0 / (1.0 + v))),
                                    1.0);
                }
                if (u < 0.0) {
                    color = vec4(   (1.0 - u_colorCap * (1.0 / (1.0 - u))), 
                                    1.0 - u_colorCap,
                                    (1.0 - u_colorCap * (1.0 / (1.0 - v))),
                                    1.0);
                }
            }
            else if (u_colorPattern == 2) {
                if (u >= 0.0) {
                    color = vec4(   (1.0 - u_colorCap * (1.0 / (1.0 + v))),
                                    (1.0 - u_colorCap * (1.0 / (1.0 + u))),
                                    1.0 - u_colorCap,
                                    1.0);
                }
                if (u < 0.0) {
                    color = vec4(   (1.0 - u_colorCap * (1.0 / (1.0 - v))),
                                    1.0 - u_colorCap,
                                    (1.0 - u_colorCap * (1.0 / (1.0 - u))), 
                                    1.0);
                }
            }
            else if (u_colorPattern == 3) {
                if (u >= 0.0) {
                    color = vec4(   u_colorCap * (1.0 / (1.0 + u)),
                                    u_colorCap * (1.0 / (1.0 + v)),
                                    u_colorCap,
                                    1.0);
                }
                if (u < 0.0) {
                    color = vec4(   u_colorCap, 
                                    u_colorCap * (1.0 / (1.0 - v)),
                                    u_colorCap * (1.0 / (1.0 - u)),
                                    1.0);
                }
            }
            else if (u_colorPattern == 4) {
                if (u >= 0.0) {
                    color = vec4(   u_colorCap * 1.0,
                                    u_colorCap * (1.0 / (1.0 + u)),
                                    u_colorCap * (1.0 / (1.0 + v)),
                                    1.0);
                }
                if (u < 0.0) {
                    color = vec4(   u_colorCap * (1.0 / (1.0 - u)),
                                    u_colorCap * 1.0,
                                    u_colorCap * (1.0 / (1.0 - v)),
                                    1.0);
                }
            }
            else if (u_colorPattern == 5) {
                if (u >= 0.0) {
                    color = vec4(   u_colorCap * (1.0 / (1.0 + v)),
                                    u_colorCap * (1.0 / (1.0 + u)),
                                    u_colorCap * 1.0,
                                    1.0);
                }
                if (u < 0.0) {
                    color = vec4(   u_colorCap * (1.0 / (1.0 - v)), 
                                    u_colorCap * 1.0,
                                    u_colorCap * (1.0 / (1.0 - u)),
                                    1.0);
                }
            }
        }
        if (isComplex == 1) {
            float real = data.r;
            float imag = data.a;
            float mag = sqrt(real*real + imag*imag);
            float phase = atan2(real, imag);

            float u = pow(u_colorSensitivity * abs(mag), u_colorExponent);

            color = vec4(1.0 - 1.0 / (1.0 + u), 
                        1.0 - 1.0 / (1.0 + u),
                        1.0 - 1.0 / (1.0 + u), 
                        1.0) * colorCurve(phase);
        }
                
        gl_FragColor = color;
    }`;

    var fragmentShaderComputeSourceSingleValued = `
    precision highp float;

    varying vec2 v_texCoord;
            
    // our texture
    uniform sampler2D u_image;
    uniform sampler2D u_image_input;

    uniform vec2 u_resolution;

    uniform vec2 u_mouse;

    uniform float u_laplace;
    uniform float u_identity;
    uniform float u_derivative;
    uniform float u_cubic;
    uniform float u_noise;
    uniform float u_inputStrength;

    uniform float u_colorSensitivity;
    uniform float u_maxVal;

    uniform float u_scaleX;
    uniform float u_scaleY;
    uniform float u_scaleT;
    uniform int u_boundaryCondition;

    uniform float u_randSeed;
    
    // the texCoords passed in from the vertex shader.

    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    float gaussian() {
        float res1 = rand(v_texCoord.xy * vec2(10.0));
        res1 = rand(vec2(res1, u_randSeed));
        float res2 = rand(v_texCoord.xy * vec2(100.0));
        res2 = rand(vec2(res2, u_randSeed));
        float res3 = rand(v_texCoord.xy * vec2(1000.0));
        res3 = rand(vec2(res3, u_randSeed));
        float res4 = rand(v_texCoord.yx * vec2(11.0));
        res4 = rand(vec2(res4, u_randSeed));
        float res5 = rand(v_texCoord.yx * vec2(101.0));
        res5 = rand(vec2(res5, u_randSeed));
        float res6 = rand(v_texCoord.yx * vec2(1001.0));
        res6 = rand(vec2(res6, u_randSeed));

        return (res1 + res2 + res3 - res4 - res5 - res6) / 6.0;
    }

    vec2 modulo(vec2 X, vec2 Y) {
        return vec2(X - floor(X / Y) * Y);
    }
    
    void main() {
        
        vec4 data = texture2D(u_image, v_texCoord);

        float u = data.r;
        float u_t = data.g;
        float u_tt = 0.0;
        float t = data.b;
        float u_x = 0.0;
        float u_y = 0.0;
        float u_xx = 0.0;
        float u_yy = 0.0;
        float u_xy = 0.0;
        float u_yx = 0.0;
        float force = 0.0;
        float noise = 0.0;
        float Delta_u = 0.0;
        float x = 0.0;
        float y = 0.0;
        float A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W;
        vec2 pixelSize = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);


        if  ((u_boundaryCondition == 0) 
            || ((u_boundaryCondition == 1) && ((v_texCoord.x > 0.5 * pixelSize.x) && (v_texCoord.y > 0.5 * pixelSize.y)
                                            && (v_texCoord.x < 1.0 - 0.5 * pixelSize.x) && (v_texCoord.y < 1.0 - 0.5 * pixelSize.y)))
            || ((u_boundaryCondition == 2) && (distance(v_texCoord, vec2(0.5,0.5)) < 0.5 - 1.0 * min(pixelSize.x, pixelSize.y)))
            || ((u_boundaryCondition == 3) && ((v_texCoord.x > 0.5 * pixelSize.x) && (v_texCoord.x < 1.0 - 0.5 * pixelSize.x)))){

            float u_above = texture2D(u_image, modulo(v_texCoord + vec2(0, pixelSize.y), vec2(1.0,1.0))).r;
            float u_below = texture2D(u_image, modulo(v_texCoord + vec2(0, -pixelSize.y), vec2(1.0,1.0))).r;
            float u_right = texture2D(u_image, modulo(v_texCoord + vec2(pixelSize.x, 0), vec2(1.0,1.0))).r;
            float u_left = texture2D(u_image, modulo(v_texCoord + vec2(-pixelSize.x, 0), vec2(1.0,1.0))).r;
            float u_right_above = texture2D(u_image, modulo(v_texCoord + vec2(pixelSize.x, pixelSize.y), vec2(1.0,1.0))).r;
            float u_right_below = texture2D(u_image, modulo(v_texCoord + vec2(pixelSize.x, -pixelSize.y), vec2(1.0,1.0))).r;
            float u_left_above = texture2D(u_image, modulo(v_texCoord + vec2(-pixelSize.x, pixelSize.y), vec2(1.0,1.0))).r;
            float u_left_below = texture2D(u_image, modulo(v_texCoord + vec2(-pixelSize.x, -pixelSize.y), vec2(1.0,1.0))).r;

            float Delta_u = (u_right - 2.0 * u + u_left) / (2.0 * u_scaleX)
                            + (u_above - 2.0 * u + u_below) / (2.0 * u_scaleY)
                            + (u_right_above - 2.0 * u + u_left_below) / (2.0 * sqrt(2.0) * u_scaleX)
                            + (u_left_above - 2.0 * u + u_right_below) / (2.0 * sqrt(2.0) * u_scaleY);
            
            if (u_noise != 0.0) {
                noise = gaussian();
            }

            force = u_inputStrength * texture2D(u_image_input, modulo(v_texCoord + pixelSize * (u_mouse - vec2(0.5, 0.5) * u_resolution), vec2(1.0,1.0))).b;
    
    `   
                
    + ((settings.useCustomEquation) ? 
        `

            u_x = (u_right - u_left) / (2.0 * u_scaleX);
            u_y = (u_above - u_below) / (2.0 * u_scaleY);
            u_xx = (u_right - 2.0 * u + u_left) / u_scaleX;
            u_yy = (u_above - 2.0 * u + u_below) / u_scaleY;
            u_xy = (u_right_above - u_left_above - u_right_below + u_left_below) / (4.0 * u_scaleX);
            u_yx = u_xy;
            x = (v_texCoord.x - 0.5) * u_resolution.x * u_scaleX;
            y = (v_texCoord.y - 0.5) * u_resolution.y * u_scaleY;
            X = texCoord_1.x * u_resolution.x * u_scaleX;
            Y = texCoord_1.y * u_resolution.y * u_scaleY;

        `
        + settings.equation.replace(/(\r\n|\n|\r)/gm, "")
        : 
        defaultEquation.replace(/(\r\n|\n|\r)/gm, ""))
    +
    `
        u_t = u_t + u_scaleT * u_tt;
        u = u + u_scaleT * u_t;
        }
        else {
            u_tt = 0.0;
            u_t = 0.0;
            u = 0.0;
        }
        t += u_scaleT;
        gl_FragColor = vec4(u, u_t, t, ` + ((settings.useCustomEquation) ? eval(settings.displayedQuantity)[0] : `u`) + `);
    }
    `; 

    var fragmentShaderComputeSourceMultiValued = `
    precision highp float;

    varying vec2 v_texCoord;
            
    // our texture
    uniform sampler2D u_image;
    uniform sampler2D u_image_input;

    uniform vec2 u_resolution;

    uniform vec2 u_mouse;

    uniform float u_laplace;
    uniform float u_identity;
    uniform float u_derivative;
    uniform float u_cubic;
    uniform float u_noise;
    uniform float u_inputStrength;

    uniform float u_colorSensitivity;
    uniform float u_maxVal;

    uniform float u_scaleX;
    uniform float u_scaleY;
    uniform float u_scaleT;
    uniform int u_boundaryCondition;

    uniform float u_randSeed;
    
    // the texCoords passed in from the vertex shader.

    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    float gaussian(float a) {
        float res1 = rand(v_texCoord.xy * vec2(a + 10.0));
        res1 = rand(vec2(res1, u_randSeed));
        float res2 = rand(v_texCoord.xy * vec2(100.0));
        res2 = rand(vec2(res2, u_randSeed));
        float res3 = rand(v_texCoord.xy * vec2(1000.0));
        res3 = rand(vec2(res3, u_randSeed));
        float res4 = rand(v_texCoord.yx * vec2(a + 11.0));
        res4 = rand(vec2(res4, u_randSeed));
        float res5 = rand(v_texCoord.yx * vec2(101.0));
        res5 = rand(vec2(res5, u_randSeed));
        float res6 = rand(v_texCoord.yx * vec2(1001.0));
        res6 = rand(vec2(res6, u_randSeed));

        return (res1 + res2 + res3 - res4 - res5 - res6) / 6.0;
    }


    vec2 modulo(vec2 X, vec2 Y) {
        return vec2(X - floor(X / Y) * Y);
    }
    
    void main() {
        
        vec4 data = texture2D(u_image, v_texCoord);

        float force = 0.0;

        float x = 0.0;
        float y = 0.0;
        float X = 0.0;
        float Y = 0.0;

        vec2 shift = vec2(0.0, 0.0);

        float t = data.b;

    `
    + 
    `
        float height = ` + Str(1 / settings.valueDimensions) + `;

        int j = int(floor(v_texCoord.y / height));
        int rev_j = ` + Str(settings.valueDimensions-1) + ` - j;

    `
    + [...Array(settings.valueDimensions).keys()].map((j) =>
    ` 
        vec2 texCoord_` + Str(j+1) + ` = v_texCoord + vec2(0.0, `+ `(` + StrF(j) + ` - float(j)) * height);
        
    `).join("")
    + [...Array(settings.valueDimensions).keys()].map((j) =>
    `
        float u_` + Str(j+1) + ` = 0.0;
        float u_` + Str(j+1) + `_t = 0.0;
        float u_` + Str(j+1) + `_tt = 0.0;
        float u_` + Str(j+1) + `_x = 0.0;
        float u_` + Str(j+1) + `_y = 0.0;
        float u_` + Str(j+1) + `_xx = 0.0;
        float u_` + Str(j+1) + `_yy = 0.0;
        float u_` + Str(j+1) + `_xy = 0.0;
        float u_` + Str(j+1) + `_yx = 0.0;
        float noise_` + Str(j+1) + ` = 0.0;
        float Delta_u_` + Str(j+1) + ` = 0.0;
        
    `).join("")
    +
    `
        float A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W;
        vec2 pixelSize = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);


        if  ((u_boundaryCondition == 0) 
            || ((u_boundaryCondition == 1) && ((texCoord_1.x > 0.6 * pixelSize.x) && (texCoord_1.y > 0.6 * pixelSize.y)
                                            && (texCoord_1.x < 1.0 - 0.4 * pixelSize.x) && (texCoord_1.y < height - 0.4 * pixelSize.y)))
            || ((u_boundaryCondition == 2) && (distance(texCoord_1, vec2(0.5, 0.5 * height)) < 0.5 * height - 1.0 * min(pixelSize.x, pixelSize.y)))
            || ((u_boundaryCondition == 3) && ((texCoord_1.x > 0.6 * pixelSize.x) && (texCoord_1.x < 1.0 - 0.4 * pixelSize.x)))) {
        `
        + [...Array(settings.valueDimensions).keys()].map((j) =>
            `
                shift = vec2(0, `+ StrF(settings.valueDimensions - 1 - j) + ` * height); 

                u_` + Str(j+1) + ` = texture2D(u_image, shift + modulo(texCoord_1, vec2(1.0,height))).r;
                u_` + Str(j+1) + `_t = texture2D(u_image, shift + modulo(texCoord_1, vec2(1.0,height))).g;

                float u_` + Str(j+1) + `_above = texture2D(u_image, shift + modulo(texCoord_1 + vec2(0, pixelSize.y), vec2(1.0,height))).r;
                float u_` + Str(j+1) + `_below = texture2D(u_image, shift + modulo(texCoord_1 + vec2(0, -pixelSize.y), vec2(1.0,height))).r;
                float u_` + Str(j+1) + `_right = texture2D(u_image, shift + modulo(texCoord_1 + vec2(pixelSize.x, 0), vec2(1.0,height))).r;
                float u_` + Str(j+1) + `_left = texture2D(u_image, shift + modulo(texCoord_1 + vec2(-pixelSize.x, 0), vec2(1.0,height))).r;
                float u_` + Str(j+1) + `_right_above = texture2D(u_image, shift + modulo(texCoord_1 + vec2(pixelSize.x, pixelSize.y), vec2(1.0,height))).r;
                float u_` + Str(j+1) + `_right_below = texture2D(u_image, shift + modulo(texCoord_1 + vec2(pixelSize.x, -pixelSize.y), vec2(1.0,height))).r;
                float u_` + Str(j+1) + `_left_above = texture2D(u_image, shift + modulo(texCoord_1 + vec2(-pixelSize.x, pixelSize.y), vec2(1.0,height))).r;
                float u_` + Str(j+1) + `_left_below = texture2D(u_image, shift + modulo(texCoord_1 + vec2(-pixelSize.x, -pixelSize.y), vec2(1.0,height))).r;

                float Delta_u_` + Str(j+1) + ` = (u_` + Str(j+1) + `_right - 2.0 * u_` + Str(j+1) + ` + u_` + Str(j+1) + `_left) / (2.0 * u_scaleX)
                                + (u_` + Str(j+1) + `_above - 2.0 * u_` + Str(j+1) + ` + u_` + Str(j+1) + `_below) / (2.0 * u_scaleY)
                                + (u_` + Str(j+1) + `_right_above - 2.0 * u_` + Str(j+1) + ` + u_` + Str(j+1) + `_left_below) / (2.0 * sqrt(2.0) * u_scaleX)
                                + (u_` + Str(j+1) + `_left_above - 2.0 * u_` + Str(j+1) + ` + u_` + Str(j+1) + `_right_below) / (2.0 * sqrt(2.0) * u_scaleY);
                
                if (u_noise != 0.0) {
                    noise_` + Str(j+1) + ` = gaussian(` + StrF(j) + `);
                }
        

                u_` + Str(j+1) + `_x = (u_` + Str(j+1) + `_right - u_` + Str(j+1) + `_left) / (2.0 * u_scaleX);
                u_` + Str(j+1) + `_y = (u_` + Str(j+1) + `_above - u_` + Str(j+1) + `_below) / (2.0 * u_scaleY);
                u_` + Str(j+1) + `_xx = (u_` + Str(j+1) + `_right - 2.0 * u_` + Str(j+1) + ` + u_` + Str(j+1) + `_left) / u_scaleX;
                u_` + Str(j+1) + `_yy = (u_` + Str(j+1) + `_above - 2.0 * u_` + Str(j+1) + ` + u_` + Str(j+1) + `_below) / u_scaleY;
                u_` + Str(j+1) + `_xy = (u_` + Str(j+1) + `_right_above - u_` + Str(j+1) + `_left_above - u_` + Str(j+1) + `_right_below + u_` + Str(j+1) + `_left_below) / (4.0 * u_scaleX);
                u_` + Str(j+1) + `_yx = u_` + Str(j+1) + `_xy;
                x = (texCoord_1.x - 0.5) * u_resolution.x * u_scaleX;
                y = (texCoord_1.y - 0.5 * height) * u_resolution.y * u_scaleY;

                X = texCoord_1.x * u_resolution.x * u_scaleX;
                Y = texCoord_1.y * u_resolution.y * u_scaleY;

            `).join("")
            + `
                force = u_inputStrength * texture2D(u_image_input, modulo(texCoord_1 + vec2(0.0, float(j) * height) + pixelSize * (u_mouse + vec2(0.5, 0.5) * u_resolution), vec2(1.0,1.0))).b;
            `
            + (settings.equation).split("#")[0].replace(/(\r\n|\n|\r)/gm, "")
            + [...Array(settings.valueDimensions).keys()].map((j) =>
                `
                    if (rev_j == ` + Str(j) + `) {
                        `
                        + ((settings.useCustomEquation) ? 
                        (settings.equation).split("#")[j+1].replace(/(\r\n|\n|\r)/gm, "")
                        : 
                        defaultMultiValuedEquation(settings.valueDimensions).split("#")[j].replace(/(\r\n|\n|\r)/gm, ""))
                        +
                        `u_` + Str(j+1) + `_t = u_` + Str(j+1) + `_t + u_scaleT * u_` + Str(j+1) + `_tt;
                        u_` + Str(j+1) + ` = u_` + Str(j+1) + ` + u_scaleT * u_` + Str(j+1) + `_t;

                        t += u_scaleT;
                        gl_FragColor = vec4(u_` + Str(j+1) + `, u_` + Str(j+1) + `_t, t, ` 
                        + ((settings.useCustomEquation) ? 
                            (eval(settings.displayedQuantity)[j].substring(0,2) === "1i" ?
                                eval(settings.displayedQuantity)[j].substring(2)
                                :
                                eval(settings.displayedQuantity)[j]
                            )
                            : 
                            `u_` + Str(j+1)) + `);
                    }
                `).join("")
            + `
            } 
        `
    +
    `
        else {
        `
        + [...Array(settings.valueDimensions).keys()].map((j) =>
        `
            if (j == ` + Str(j) + `) {
                u_` + Str(j+1) + `_tt = 0.0;
                u_` + Str(j+1) + `_t = 0.0;
                u_` + Str(j+1) + ` = 0.0;

                t += u_scaleT;
                gl_FragColor = vec4(u_` + Str(j+1) + `, u_` + Str(j+1) + `_t, t, 0.0);
            }`).join("")
    +   `}
    }`;

    var fragmentShaderComputeSource = (settings.valueDimensions > 1) ? 
        fragmentShaderComputeSourceMultiValued : fragmentShaderComputeSourceSingleValued;
    
    console.log(fragmentShaderColorSource);

    var nb_textures = 3;
    var textures = [];
    var framebuffers = [];
    var F = eval(settings.initialDataFunction.replace(
        /u_laplace/g, Str(settings.laplacian)
    ).replace(
        /u_identity/g, Str(settings.identity)
    ).replace(
        /u_cubic/g, Str(settings.cubic)
    ).replace(
        /u_derivative/g, Str(settings.derivative)
    ).replace(
        /u_noise/g, Str(settings.noise)
    ));
    console.log(F)

    for (var k = 0; k < nb_textures; k++) {
        var texture = createAndSetupTexture(gl);
        textures.push(texture);
        
        var textureData = new Float32Array(4 * width * height);

        var h = height / settings.valueDimensions;
        for(var i = 0; i < width; i++) {
            for(var j = 0; j < height; j++) {
                var x = (i + 0.5 - width / 2)* settings.scaleX;
                var p = Math.floor(Math.floor(j / h));
                var y = (h / 2 + p * h - j - 0.5) * settings.scaleY;

                var X = x + width / 2 * settings.scaleX;
                var Y = y + h / 2 * settings.scaleX;
                var transformation = (F) => [...Array(settings.valueDimensions).keys()].map((j) => (x,y) => F(x,y)[j])
                var f = transformation(F)[p]
                
                var initialData = f(x,y);
                if (k == 0) {

                    textureData[j * width * 4 + i * 4 + 0] = initialData[0];
                    textureData[j * width * 4 + i * 4 + 1] = initialData[1];
                    textureData[j * width * 4 + i * 4 + 2] = 0.0;
                    textureData[j * width * 4 + i * 4 + 3] = 0.0;
                }
                else {
                    textureData[j * width * 4 + i * 4 + 0] = 0.0;
                    textureData[j * width * 4 + i * 4 + 1] = 0.0;
                    textureData[j * width * 4 + i * 4 + 2] = 0.0;
                    textureData[j * width * 4 + i * 4 + 3] = 0.0;
                }
                
            }
        }
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, textureData);
        
        // Create a framebuffer
        var fbo = gl.createFramebuffer();
        framebuffers.push(fbo);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        // Attach a texture to it.
        var attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, texture, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.log("attachment error");
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT)  {
                console.log("incomplete attachment");
            }
        }
        


    }

    var inputTexture = createAndSetupTexture(gl);
    var inputTextureData = new Float32Array(4 * width * height);

    for(var i = 0; i < height; i++) {
        for(var j = 0; j < width; j++) {
            inputTextureData[i * width * 4 + j * 4 + 0] = 0.0;
            inputTextureData[i * width * 4 + j * 4 + 1] = 0.0;

            var R_squared = Math.pow(settings.inputRadius,2);
            var r_squared = Math.pow((i - height/2), 2) + Math.pow((j - width/2), 2);
            if (r_squared < R_squared) {
                
                inputTextureData[i * width * 4 + j * 4 + 2] = Math.pow(2, -R_squared / (R_squared - r_squared));
            }
            else {
                inputTextureData[i * width * 4 + j * 4 + 2] = 0.0;
            }
            
            inputTextureData[i * width * 4 + j * 4 + 3] = 0.0;

        }
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, inputTextureData);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);

    // send the vertex positions to the GPU
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    setRectangle(gl, 0, 0, width, height);

    // define vertex texcoords
    var texCoords = new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0,
    ]);

    // send the vertex texcoords to the GPU
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

    var fragmentShaderCompute = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderComputeSource);
    var fragmentShaderColor = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderColorSource);

    var shaderProgramCompute = createProgram(gl, vertexShader, fragmentShaderCompute);
    var shaderProgramColor = createProgram(gl, vertexShader, fragmentShaderColor);   

    gl.useProgram(shaderProgramCompute);

    var positionAttribute = gl.getAttribLocation(shaderProgramCompute, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    var texcoordAttribute = gl.getAttribLocation(shaderProgramCompute, "a_texCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(texcoordAttribute);
    gl.vertexAttribPointer(texcoordAttribute, 2, gl.FLOAT, false, 0, 0);

    var imageUniform = gl.getUniformLocation(shaderProgramCompute, "u_image");
    gl.uniform1i(imageUniform, 0);
    var imageInputUniform = gl.getUniformLocation(shaderProgramCompute, "u_image_input");
    gl.uniform1i(imageInputUniform, 1);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);

    var resolutionLocation = gl.getUniformLocation(shaderProgramCompute, "u_resolution");
    gl.uniform2f(resolutionLocation, width, height);
    
    var flipYLocation = gl.getUniformLocation(shaderProgramCompute, "u_flipY");
    gl.uniform1f(flipYLocation, 1.0);


    applyComputeSettings(gl, shaderProgramCompute, settings);

    gl.useProgram(shaderProgramColor);

    var positionAttribute = gl.getAttribLocation(shaderProgramColor, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    var texcoordAttribute = gl.getAttribLocation(shaderProgramColor, "a_texCoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(texcoordAttribute);
    gl.vertexAttribPointer(texcoordAttribute, 2, gl.FLOAT, false, 0, 0);

    var imageUniform = gl.getUniformLocation(shaderProgramColor, "u_image_color")
    gl.uniform1i(imageUniform, 0);

    var resolutionLocation = gl.getUniformLocation(shaderProgramColor, "u_resolution");
    gl.uniform2f(resolutionLocation, width, height);
    
    var flipYLocation = gl.getUniformLocation(shaderProgramColor, "u_flipY");
    gl.uniform1f(flipYLocation, 1.0);

    applyColorSettings(gl, shaderProgramColor, settings);
    
    
    /*
    var pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    console.log("logging pixels: ");
    console.log(pixels);
    */


    gl.useProgram(shaderProgramCompute);
    var mouseLocation = gl.getUniformLocation(shaderProgramCompute, "u_mouse");
    gl.uniform2f(mouseLocation, 0, 0);

    var inputStrengthLocation = gl.getUniformLocation(shaderProgramCompute, "u_inputStrength");
    gl.uniform1f(inputStrengthLocation, 0);

    var time = 0;
    
    gl.bindTexture(gl.TEXTURE_2D, textures[time % 2]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[(time + 1) % 2]);

    var randSeedLocation = gl.getUniformLocation(shaderProgramCompute, "u_randSeed");

    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);

    var update = function(){
        //console.log("updating");
        //console.time();
        gl.useProgram(shaderProgramCompute);
        if (settings.noise > 0.0) {
            gl.uniform1f(randSeedLocation, Math.random());
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[time % 2]);
        
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[(time + 1) % 2]);
        gl.viewport(0, 0, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        //console.timeEnd();
        //console.time();
        gl.useProgram(shaderProgramColor);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[(time + 1) % 2]);
        

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        //console.timeEnd();
        time += 1;

        

    }
    update();

    terminate = setInterval(function() {
        for (var k = 0; k < settings.speed; k++) {
            update();
        }
    }, settings.delay);

    var toggle = 1.0;
    
    var onmousedown = function(e) {
        gl.useProgram(shaderProgramCompute);
        var X = e.clientX || e.targetTouches[0].clientX;
        var Y = e.clientY || e.targetTouches[0].clientY;
        var rect = canvas.getBoundingClientRect();
        var x = (X-rect.x) * width / rect.width;
        var y = (Y-rect.y) * height / rect.height;
        gl.uniform2f(mouseLocation, -x, y);
        gl.uniform1f(inputStrengthLocation, toggle * settings.inputStrength);
        toggle *= -1.0;
    }
    var onmouseup = function(e) {
        gl.useProgram(shaderProgramCompute);
        gl.uniform1f(inputStrengthLocation, 0.0);

    }
    var onmousemove = function(e) {
        gl.useProgram(shaderProgramCompute);
        var X = e.clientX || e.targetTouches[0].clientX;
        var Y = e.clientY || e.targetTouches[0].clientY;
        var rect = canvas.getBoundingClientRect();
        var x = (X-rect.x) * width / rect.width;
        var y = (Y-rect.y) * height / rect.height;
        gl.uniform2f(mouseLocation, -x, y);

    }

    canvas.onmousedown = onmousedown;
    canvas.onmousemove = onmousemove;
    canvas.onmouseup = onmouseup;
    if (window.navigator.msPointerEnabled) {
        canvas.addEventListener("MSPointerDown", onmousedown, false);
        canvas.addEventListener("MSPointerMove", onmousemove, false);
        canvas.addEventListener("MSPointerUp", onmouseup, false);
    }
    else {
        canvas.addEventListener("touchstart", onmousedown, false);
        canvas.addEventListener("touchmove", onmousemove, false);
        canvas.addEventListener("touchend", onmouseup, false);
    }
      
    

    return terminate;
}

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}


function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
   
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function applyComputeSettings(gl, shaderProgram, settings) {

    gl.useProgram(shaderProgram);

    var laplaceLocation = gl.getUniformLocation(shaderProgram, "u_laplace");
    gl.uniform1f(laplaceLocation, settings.laplacian * settings.defaultLaplacian);

    var identityLocation = gl.getUniformLocation(shaderProgram, "u_identity");
    gl.uniform1f(identityLocation, settings.identity * settings.defaultIdentity);

    var derivativeLocation = gl.getUniformLocation(shaderProgram, "u_derivative");
    gl.uniform1f(derivativeLocation, settings.derivative * settings.defaultDerivative);

    var cubicLocation = gl.getUniformLocation(shaderProgram, "u_cubic");
    gl.uniform1f(cubicLocation, settings.cubic * settings.defaultCubic);

    var noiseLocation = gl.getUniformLocation(shaderProgram, "u_noise");
    gl.uniform1f(noiseLocation, settings.noise * settings.defaultNoise);

    var inputStrengthLocation = gl.getUniformLocation(shaderProgram, "u_inputStrength");
    gl.uniform1f(inputStrengthLocation, settings.inputStrength);

    var scaleXLocation = gl.getUniformLocation(shaderProgram, "u_scaleX");
    gl.uniform1f(scaleXLocation, settings.scaleX);

    var scaleYLocation = gl.getUniformLocation(shaderProgram, "u_scaleY");
    gl.uniform1f(scaleYLocation, settings.scaleY);

    var scaleTLocation = gl.getUniformLocation(shaderProgram, "u_scaleT");
    gl.uniform1f(scaleTLocation, settings.scaleT);

    var maxValLocation = gl.getUniformLocation(shaderProgram, "u_maxVal");
    gl.uniform1f(maxValLocation, settings.maxVal);

    var boundaryConditionLocation = gl.getUniformLocation(shaderProgram, "u_boundaryCondition");
    gl.uniform1i(boundaryConditionLocation, settings.boundaryCondition);

    var randSeedLocation = gl.getUniformLocation(shaderProgram, "u_randSeed");
    gl.uniform1f(randSeedLocation, 0.0);

    var inputLaplacian = document.getElementById("laplacian");
    inputLaplacian.value = settings.laplacian;
    inputLaplacian.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.laplacian = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(laplaceLocation, settings.laplacian * settings.defaultLaplacian);
    }
    var inputDerivative = document.getElementById("derivative");
    inputDerivative.value = settings.derivative;
    inputDerivative.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.derivative = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(derivativeLocation, settings.derivative * settings.defaultDerivative);
    }
    var inputIdentity = document.getElementById("identity");
    inputIdentity.value = settings.identity;
    inputIdentity.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.identity = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(identityLocation, settings.identity * settings.defaultIdentity);
    }
    var inputCubic = document.getElementById("cubic");
    inputCubic.value = settings.cubic;
    inputCubic.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.cubic = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(cubicLocation, settings.cubic * settings.defaultCubic);
    }
    var inputNoise = document.getElementById("noise");
    inputNoise.value = settings.noise;
    inputNoise.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.noise = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(noiseLocation, settings.noise * settings.defaultNoise);
    }
    var inputScaleT = document.getElementById("scaleT");
    inputScaleT.value = settings.scaleT;
    inputScaleT.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.scaleT = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(scaleTLocation, settings.scaleT);
    }
    var inputScaleXY = document.getElementById("scaleXY");
    inputScaleXY.value = settings.scaleX;
    inputScaleXY.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.scaleX = parseFloat(event.target.value);
        settings.scaleY = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(scaleXLocation, settings.scaleX);
        gl.uniform1f(scaleYLocation, settings.scaleY);
    }

    var inputBoundaryCondition = document.getElementById("boundaryCondition");
    inputBoundaryCondition.value = settings.boundaryCondition;
    inputBoundaryCondition.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.boundaryCondition = parseInt(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1i(boundaryConditionLocation, settings.boundaryCondition);
    }

    var inputSpeed = document.getElementById("speed");
    inputSpeed.value = settings.speed;
    inputSpeed.onchange = function(event) {
        settings.speed = parseInt(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
    }
    var inputInputStrength = document.getElementById("inputStrength");
    inputInputStrength.value = settings.inputStrength;
    inputInputStrength.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.inputStrength = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        //gl.uniform1f(inputStrengthLocation, settings.inputStrength);
    }
    
}

function applyColorSettings(gl, shaderProgram, settings) {

    gl.useProgram(shaderProgram);

    var colorSensitivityLocation = gl.getUniformLocation(shaderProgram, "u_colorSensitivity");
    gl.uniform1f(colorSensitivityLocation, settings.colorSensitivity);

    var colorMixRatioLocation = gl.getUniformLocation(shaderProgram, "u_colorMixRatio");
    gl.uniform1f(colorMixRatioLocation, settings.colorMixRatio);

    var colorExponentLocation = gl.getUniformLocation(shaderProgram, "u_colorExponent");
    gl.uniform1f(colorExponentLocation, settings.colorExponent);

    var colorMixExponentLocation = gl.getUniformLocation(shaderProgram, "u_colorMixExponent");
    gl.uniform1f(colorMixExponentLocation, settings.colorMixExponent);

    var colorCapLocation = gl.getUniformLocation(shaderProgram, "u_colorCap");
    gl.uniform1f(colorCapLocation, settings.colorCap);

    var colorPatternLocation = gl.getUniformLocation(shaderProgram, "u_colorPattern");
    gl.uniform1i(colorPatternLocation, settings.colorPattern);

    var maxValLocation = gl.getUniformLocation(shaderProgram, "u_maxVal_color");
    gl.uniform1f(maxValLocation, settings.maxVal);

    var inputColorSensitivity = document.getElementById("colorSensitivity");
    inputColorSensitivity.value = settings.colorSensitivity;
    inputColorSensitivity.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.colorSensitivity = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(colorSensitivityLocation, settings.colorSensitivity);
    }
    var inputColorMixRatio = document.getElementById("colorMixRatio");
    inputColorMixRatio.value = settings.colorMixRatio;
    inputColorMixRatio.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.colorMixRatio = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(colorMixRatioLocation, settings.colorMixRatio);
    }
    var inputColorExponent = document.getElementById("colorExponent");
    inputColorExponent.value = settings.colorExponent;
    inputColorExponent.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.colorExponent = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(colorExponentLocation, settings.colorExponent);
    }
    var inputColorMixExponent = document.getElementById("colorMixExponent");
    inputColorMixExponent.value = settings.colorMixExponent;
    inputColorMixExponent.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.colorMixExponent = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(colorMixExponentLocation, settings.colorMixExponent);
    }
    var inputColorCap = document.getElementById("colorCap");
    inputColorCap.value = settings.colorCap;
    inputColorCap.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.colorCap = parseFloat(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1f(colorCapLocation, settings.colorCap);
    }
    var inputColorPattern = document.getElementById("colorPattern");
    inputColorPattern.value = settings.colorPattern;
    inputColorPattern.onchange = function(event) {
        gl.useProgram(shaderProgram);
        settings.colorPattern = parseInt(event.target.value);
        inputSettingsJSON.value = JSON.stringify(settings, null, 2);
        window.location.hash = encodeURIComponent(JSON.stringify(settings, null, 2));
        gl.uniform1i(colorPatternLocation, settings.colorPattern);
    }
}




// helper function for loading shader sources
function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}


function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
 
    // Set up texture so we can render any size image and so we are
    // working with pixels.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
 
    return texture;
}

function generateCellularAutomaton(rule) {
    
    var birthsConditional = "";
    var survivalConditional = ""; 
    
    var i = rule.indexOf('B');
    i += 1;
    while (i < rule.length && rule[i] != 'S') {
        var char = rule[i];
        console.log("i = ", i, " char = ", char);
        console.log("parse", parseInt(char));
        console.log("nan?", isNaN(parseInt(char)));
        if (!isNaN(parseInt(char))) {
            console.log("inside")
            if (birthsConditional.length > 0) {
                birthsConditional += " || "
            }
            birthsConditional += "(B > " + (parseInt(char) - 0.4).toString() 
                                + " && B < " + (parseInt(char) + 0.4).toString() + ")"
        }
        console.log("B: ", birthsConditional);
        i += 1;
    }
    i += 1;
    while (i < rule.length) {
        var char = rule[i];
        console.log("i = ", i, " char = ", char);
        console.log("parse", parseInt(char));
        console.log("nan?", isNaN(parseInt(char)));
        if (!isNaN(parseInt(char))) {
            console.log("inside");
            if (survivalConditional.length > 0) {
                survivalConditional += " || "
            }
            survivalConditional  += "(B > " + (parseInt(char) - 0.4).toString() 
                                + " && B < " + (parseInt(char) + 0.4).toString() + ")"
        }
        console.log("S: ", survivalConditional);
        i += 1;
    }

    var output = 
    `B = u_right + u_left
     + u_above + u_below
     + u_right_above + u_right_below
     + u_left_above + u_left_below;
    
    if (u < 0.4`
    + ((birthsConditional.length > 0) ? " && (" + birthsConditional + ")"
    : " && (0 == 1)")
    + `) {
        A = 1.0;
    }
    else if (u > 0.6`
    + ((survivalConditional.length > 0) ? " && (" + survivalConditional + ")"
    : "&& (0 == 1)")
    + `) {
        A = 1.0;
    }
    else {
        A = 0.0;
    }
    if (abs(force) + u_noise * abs(noise) > 0.5) {
        A = 1.0;
    }
    u = A;`

    console.log("result: ", output)
    return output;
}