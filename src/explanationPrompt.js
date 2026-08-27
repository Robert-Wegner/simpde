const SIMPDE_EXPLANATION_PROMPT = `You are helping a user modify this PDE simulator. Read this reference carefully, then follow the user's requested change. When settings or an application configuration are supplied alongside this prompt, treat those JSON blocks as the source material. Preserve unrelated values and preserve the numerical kernel conventions described below. Return complete, valid JSON for every object you modify, with no JavaScript comments inside JSON. Briefly explain important choices outside the JSON.

WHAT SIMPDE IS

This is a browser-based WebGL 2 simulator for systems of time-dependent scalar partial differential equations on a two-dimensional x/y grid. It can also run Life-like cellular automata. Simulation state is held in floating-point GPU textures and advanced by a generated GLSL ES 3.00 fragment shader. A separate color shader turns selected quantities into pixels.

There are two different JSON objects:

1. The current settings object describes one running simulation: resolution, time step, equation, initial data, boundary mode, field count, input brush, and visualization.
2. The application configuration object describes the app itself: its title, collapsible group tree, available controls, defaults, validation, shader uniforms, and whether changing a control restarts the simulation.

Changing settings changes the current simulation. Changing the application configuration can turn the simulator into a focused app, such as a Schrödinger-equation simulator with a fixed hidden equation and only a few exposed physical parameters. The configuration is JSON data, not React source code.

BUILT-IN EXAMPLES AND THE SHARED BASE

The app treats Simulation, Visualization, the group tree, and the JSON interfaces as shared infrastructure. Input and Model are the creative layer. The Examples section applies a complete application configuration and matching settings together. Built-in examples include a stochastic nonlinear wave, a two-component nonlinear Schrödinger wave packet with adjustable power, a three-component artificial-compressibility Navier–Stokes vortex dipole, stochastic complex Ginzburg–Landau and Swift–Hohenberg pattern systems, the heat equation, a position-dependent linear wave equation with a left-side source and adjustable central material lens, Conway's Game of Life, and an alternative B3S134567 cellular automaton. Loading an example replaces both current objects; copy unsaved custom JSON before switching.

The Navier–Stokes example uses horizontal velocity, vertical velocity, and a locally evolved artificial-compressibility pressure field. This fits the local generated-shader architecture, but it is not a projection solver with a global pressure Poisson solve. The cellular-automaton example exposes the B/S rule control; ordinary PDE configurations keep that engine property hidden.

CURRENT INTERFACE

The simulation canvas uses nearly the full viewport width and preserves its texture aspect ratio, extending below the fold when necessary. The control drawer overlays the left side without changing canvas geometry and starts closed. Restart remains visible beside the drawer toggle. A light/dark switch changes only the surrounding interface theme; it does not change the simulation color shader or visualization settings.

Visible controls are organized into Configuration (Input, Model, Visualization, and Examples) and Simulation & data (Simulation and JSON interfaces). The configuration schema still uses leaf paths such as /settings/model/basic and /settings/model/advanced for compatibility, but the visible interface flattens those Basic/Advanced leaves into their parent section. Editing a loaded preset changes the example selector to Custom / modified rather than naming a different preset.

Built-in presets use a 1200 by 800 simulation texture on desktop and 600 by 1000 on viewports at or below 760 CSS pixels. A built-in preset switches between those sizes if the viewport crosses that breakpoint. Manually changing a setting clears the active preset, so custom dimensions are then preserved.

CORE NUMERICAL MODEL

The spatial grid is always two-dimensional. valueDimensions is the number N of scalar fields in the system, named u_1 through u_N; it is not the number of spatial dimensions. The N fields are displayed as vertically stacked slabs in one texture.

For every field, the texture stores u, u_t, time, and the displayed quantity. Two settings choose how equation output becomes the next state: timeOrder and integrationMethod.

With timeOrder 1, each field section assigns u_i_t as the first derivative of u_i. This is the natural representation for Schrödinger, diffusion, advection, and reaction-diffusion systems. With timeOrder 2, the stored state is the pair (u_i, u_i_t), and each section normally assigns u_i_tt. This is the natural representation for wave, oscillator, and Klein-Gordon-type systems.

The semiImplicitEuler method preserves the original second-order update in this exact order:

u_i_t = u_i_t + scaleT * u_i_tt
u_i   = u_i   + scaleT * u_i_t

For timeOrder 1, semiImplicitEuler performs forward Euler: u_i = u_i + scaleT * u_i_t. The rk4 method evaluates the complete coupled field texture at four Runge-Kutta stages before combining them. It is much more suitable for oscillatory first-order systems, although it remains an explicit method with a finite stability region. The discrete method performs no automatic state increment; equation sections assign the next u_i and u_i_t directly. Cellular automata select timeOrder 1 and discrete automatically.

Do not duplicate the selected integration in an ordinary PDE equation. For RK4, all field right-hand sides must be ordinary functions of the sampled stage state; do not update a field in anticipation of another field's stage.

CURRENT SETTINGS REFERENCE

width: Integer simulation texture width in pixels, from 1 to 3000. Larger values cost GPU memory and work. Built-in presets standardize this to 1200 on desktop and 600 on mobile.

height: Integer total texture height in pixels, from 1 to 3000. All field slabs share this total height, so each field receives approximately height / valueDimensions rows. Built-in presets standardize this to 800 on desktop and 1000 on mobile.

scaleT: Nonnegative simulation time step used by the selected integrator. Stability depends on the equation, integrator, derivative order, and spatial scales. A smaller value is usually safer.

scaleX, scaleY: Positive physical grid spacing in x and y. Generated spatial derivatives divide by the appropriate powers of these values.

offsetX, offsetY: Coordinate offsets exposed to GLSL as part of x and y. They affect coordinate-dependent equations, but do not translate the already-created initial-data array.

speed: Positive integer compute iterations performed per displayed timer tick.

delay: Nonnegative integer timer interval in milliseconds. It controls scheduling, not simulated time; simulated time advances by speed * scaleT per displayed tick.

valueDimensions: Integer field count from 1 to 16. Use N entries in initialDataFunction, N equation sections, and N displayedQuantity entries. Changing this control regenerates those three strings only when they still equal their previous standard generated values; custom strings are preserved for manual editing.

timeOrder: Either 1 or 2. In first-order mode, assign u_i_t and treat only u_i as evolving state; the green texture channel retains the latest derivative for inspection. In second-order mode, u_i and u_i_t are both evolving state and the equation assigns u_i_tt.

integrationMethod: semiImplicitEuler, rk4, or discrete. semiImplicitEuler is the backward-compatible original method and is inexpensive. rk4 is classical four-stage Runge-Kutta and uses several additional full-resolution floating-point textures and shader passes. discrete is for direct state-replacement rules and normally should not be used for a continuous PDE.

inputRadius: Positive integer radius, in texture pixels, of the smooth pointer brush.

inputStrength: Brush amplitude. The corresponding shader force is zero while the pointer is up. Successive pointer presses alternate the sign of the applied amplitude.

initialDataFunction: A STRING CONTAINING JAVASCRIPT, not GLSL. It must evaluate to a function with the form (x, y) => [[u_1, u_1_t], ..., [u_N, u_N_t]]. It is called once per grid point and every returned number must be finite. JavaScript expressions and Math functions are allowed. Numeric settings from the application configuration are available by their property names. Example for two fields:

(x, y) => [[Math.exp(-(x*x + y*y) / 100.0), 0.0], [0.0, 0.0]]

The outer array must have at least N entries and each field entry must contain value and first time derivative. Keep the function deterministic unless randomized initial data is genuinely intended. Because this string is executed as user-authored JavaScript, only use trusted code.

laplace, identity, derivative, cubic: Default model coefficients made available as float uniforms in the compute shader. The standard equation uses them for the Laplacian, linear restoring term, damping term, and cubic nonlinearity. They are ordinary configuration-defined uniforms and may be hidden, renamed only with coordinated equation/configuration changes, or supplemented by new parameters.

noiseStrength: Amplitude of the generated spatial noise variable. Noise is regenerated during compute updates when this value is nonzero.

useCellularAutomatonRule: Empty for PDE mode, or a Life-like rule in B...S... notation. B3S23 is Conway's Game of Life. Digits 0 through 8 list neighbor counts that cause birth or survival. Applying a nonempty rule normalizes it, changes valueDimensions to 1, selects timeOrder 1 and discrete integration, generates the automaton GLSL equation, and displays u_1. Pointer input paints live cells. This property is hidden in the standard PDE interface and exposed by the Life-like cellular-automaton example.

boundaryCondition: Integer boundary mode. 0 is periodic wrapping. 1 forces the rectangular outer edge to zero. 2 forces the outside of a centered circle to zero. 3 forces only the left and right edges to zero. The simulator does not currently have a JSON field for arbitrary Dirichlet, Neumann, time-dependent, or per-field boundary data. Such a feature requires an engine change. Coordinate-dependent forcing can sometimes be expressed inside an equation while using periodic mode, but that is not the same as a true derivative boundary condition.

equation: A STRING CONTAINING GLSL ES 3.00 STATEMENTS, not JavaScript. See the equation-language section below.

colorSensitivity: Nonnegative multiplier applied before mapping the displayed value or complex magnitude to brightness.

colorMixRatio: Nonnegative secondary color response. In complex coloring it also affects the hue curve.

colorExponent: Nonnegative exponent in the primary brightness response.

colorMixExponent: Nonnegative exponent in the secondary color response.

colorCap: Number from 0 to 1 controlling the maximum contribution used by the real-valued color curves.

colorPattern: Integer 0 through 5 selecting one of six channel permutations/inversions for real-valued plots.

displayedQuantity: A string representing a list of exactly N quoted or backtick-delimited GLSL expressions, one for each field slab. Examples are ["u_1"] and ["u_1", "u_2_x"]. The expressions execute after the equation and integration and are stored in the texture alpha channel. Prefix an entry's expression with 1i to enable complex-domain coloring for that field. In complex mode, u_i is the real part and the expression after 1i is the imaginary part. For example, with two fields, ["1i u_2", "u_2"] colors the first slab as the complex value u_1 + i*u_2 and plots u_2 normally in the second slab. Every referenced field must exist under the configured valueDimensions.

THE GLSL EQUATION LANGUAGE

The equation string is split on # characters. Text before the first # is a shared statement section. Exactly one field section must follow for each configured field. For two fields:

shared statements;
#
u_1_tt = u_1_xx + u_1_yy;
#
u_2_tt = u_2_xx + u_2_yy;

An empty shared section is normal, so a standard equation begins with #. Each section is inserted inside the generated fragment shader's main function. Write GLSL statements only. Do not include #version, precision declarations, a main function, nested function definitions, or conflicting uniform declarations. End assignments and declarations with semicolons. Use GLSL syntax and types: float, int, bool, vec2, vec3, vec4, if/else, for loops with shader-compatible bounds, and functions such as sin, cos, exp, pow, sqrt, abs, min, max, length, and distance. Prefer floating-point literals such as 1.0 when working with floats. JavaScript syntax such as Math.sin, const, let, ===, arrays, arrow functions, undefined, and NaN is invalid here.

Available per-field variables are u_i, u_i_t, and u_i_tt. Under timeOrder 1, assign u_i_t as the right-hand side. Under timeOrder 2, assign u_i_tt; u_i_t is the stored velocity. Under discrete integration, direct assignments become the next state and no Euler/RK increment follows. RK4 requires derivative-style equations and should not directly replace u_i.

Coordinates and common values available in GLSL include x and y centered on the local field and shifted by offsetX/offsetY; X and Y as non-centered scaled coordinates; t as simulation time; force as pointer input; noise as generated spatial noise; and configured shader uniforms such as laplace. Scratch floats A through W are predeclared for convenient intermediate calculations. Avoid redeclaring any generated name.

For every valid field i, the eight immediate neighbor samples are available as:

u_i_right, u_i_left, u_i_above, u_i_below,
u_i_right_above, u_i_right_below, u_i_left_above, u_i_left_below

Spatial differential variables are generated automatically when referenced in the equation or displayedQuantity. Append any sequence of x and y to u_i, or to u_i_t for a spatial derivative of the first time derivative. Examples:

u_1_x, u_1_y, u_1_xx, u_1_yy, u_1_xy, u_1_yx,
u_1_xxx, u_1_xxyy, u_2_t_x, u_2_t_xy

The suffix determines derivative order and scaleX/scaleY powers. Mixed derivatives are generated as tensor-product finite-difference stencils. Sampling wraps periodically at the texture level; zero boundary modes overwrite their designated boundary pixels after evaluation. Consequently, a zero edge is represented by stored zero cells rather than a separately supplied ghost-cell function.

All field variables exist in the generated shader, so coupled systems may reference other fields. Example:

#
u_1_tt = u_1_xx + u_1_yy - u_1 + 0.2 * u_2;
#
u_2_tt = 0.5 * (u_2_xx + u_2_yy) - u_2 - 0.2 * u_1;

Be conservative about GPU compatibility: avoid recursion, dynamic allocation, unsupported extensions, excessive stencil order, and loops whose bounds cannot be compiled efficiently. A syntax error prevents the generated shader from compiling and is shown in the app.

APPLICATION CONFIGURATION REFERENCE

The application configuration has schemaVersion, title, group, and vars.

title is configuration metadata retained for compatibility and JSON identification; the current interface does not render a page title above the simulation. group is a recursive tree whose nodes have name, displayName, and subgroups. A property's group is an absolute path made from group names, such as /settings/model/basic. Put the property in an existing leaf path to display it there. Basic and advanced leaf paths remain valid even though the current visible menu combines them under their parent section.

vars is an array of property definitions. Supported property types are int, float, and string. Common fields are:

name: Stable machine name and settings-object key. For shader uniforms it should also be a valid identifier. Do not casually rename required engine properties.

displayName: Human-readable control label.

group: Absolute path to the leaf UI group containing the control.

type: int, float, or string.

defaultValue: JSON default value. Use a number for int/float and text for string.

defaultValueGenerator: Instead of defaultValue, one of the built-in generator identifiers standardWaveEquation, standardDisplayedQuantities, or zeroInitialData. These adapt their strings to valueDimensions. Other generator names are invalid unless engine source is extended.

minimum, maximum, exclusiveMinimum, exclusiveMaximum: Numeric validation limits.

pattern: JavaScript regular-expression source used to validate string values.

description: Help text shown when the user clicks the control label.

hidden: When true, retain the setting and engine behavior but omit its input from the visible UI. This is the preferred way to fix internal settings in a specialized app.

uniformName: GLSL uniform identifier. Add this only when the setting must be declared in a shader.

uniformType: Currently float or int, matching the GLSL declaration and the setting value.

shaderPrograms: Array containing compute, color, and/or vertex. compute exposes the uniform to the simulation shader; color exposes it to plotting; vertex exposes it to geometry and is linked into both generated programs. Use only the programs that reference the uniform.

restartOnChange: If true, changing the value rebuilds simulation state, textures, and shaders. Use true for resolution, field layout, generated shader source, initial data, brush texture size, timer structure, or any setting that cannot be updated as a live uniform. Use false for ordinary numeric uniforms that can update in place.

effect: Optional built-in UI behavior. resizeFields is used by valueDimensions. cellularAutomaton is used by useCellularAutomatonRule. Other effect names have no implementation unless source code is extended.

The engine requires its core properties to remain present: width, height, scaleT, scaleX, scaleY, offsetX, offsetY, speed, delay, valueDimensions, inputRadius, inputStrength, initialDataFunction, boundaryCondition, equation, displayedQuantity, noiseStrength, colorSensitivity, colorMixRatio, colorExponent, colorMixExponent, colorCap, and colorPattern. New configurations should also include timeOrder and integrationMethod so users can select the temporal model; older configurations without them fall back to second-order semi-implicit Euler. Model coefficients such as laplace may be changed or replaced if equations and uniform declarations are changed consistently. For a specialized app, keep required properties, set appropriate defaults, and hide controls the user should not edit.

To add a new equation parameter, add a numeric property to vars, give it a unique name, valid group, default and validation, set uniformName to the GLSL identifier, uniformType to float or int, include compute in shaderPrograms, and normally set restartOnChange to false. The equation can then reference the new uniform by name. To add a visualization parameter used by the color shader, target color instead.

JSON AND EDITING RULES

Both interfaces require strict JSON: double-quoted keys and strings, no trailing commas, no comments, and escaped newlines inside JavaScript/GLSL strings. The in-app editors display multiline strings correctly through JSON escaping.

Applying a settings JSON object fills omitted properties from configuration defaults; it does not merge omitted properties from the previously running settings. Therefore, when modifying supplied settings, return the complete settings object unless the user explicitly wants a reset to defaults. Legacy names laplacian and noise, and legacy equation identifiers u_laplace, u_identity, u_derivative, u_cubic, u_noise, and Delta_u_i are migrated when possible, but new output should use the current names.

Settings supplied in a URL hash are loaded at startup, but edits made in the current interface are not automatically written back to the URL. The current settings and any modified application configuration live in React state, so retain or copy their JSON before reloading or sharing.

When asked to modify the simulator:

1. Decide whether the request changes the current simulation settings, the reusable application configuration, or both.
2. Keep valueDimensions, the number of initial-data field pairs, equation # sections, and displayedQuantity entries consistent.
3. Choose timeOrder and integrationMethod consistently with what the equation assigns.
4. Keep JavaScript only in initialDataFunction. Keep GLSL only in equation and displayedQuantity expressions.
5. Preserve required engine properties and numerical update conventions.
6. Use hidden properties and focused groups to specialize the UI instead of deleting required engine state.
7. Validate ranges, JSON escaping, GLSL identifiers, uniform declarations, and restart behavior.
8. Return complete valid JSON objects with clear labels so they can be pasted directly into the appropriate JSON interface.`;

export {SIMPDE_EXPLANATION_PROMPT};
