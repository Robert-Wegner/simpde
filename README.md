# SimPDE

SimPDE is a browser-based WebGL 2 playground for systems of partial differential equations and Life-like cellular automata. A JSON-serializable application specification defines the settings interface, defaults, validation, uniforms, and restart behavior. A separate settings object contains the current simulation.

## Run it

Use Node.js and npm:

```text
npm install
npm start
```

The production checks are:

```text
npm test -- --watchAll=false
npm run build
```

## Application configuration

Open **JSON interfaces** in the settings panel to edit either:

- **Current settings JSON**, which changes the current simulation.
- **Application configuration JSON**, which changes the settings interface and its shader uniforms.

The configuration is ordinary JSON. Its `group` tree defines the collapsible interface, and each entry in `vars` defines one property. Common property fields are:

```json
{
  "name": "mass",
  "displayName": "Mass",
  "group": "/settings/model/basic",
  "type": "float",
  "minimum": 0,
  "defaultValue": 1,
  "uniformName": "mass",
  "uniformType": "float",
  "shaderPrograms": ["compute"],
  "restartOnChange": false,
  "description": "A coefficient available in the equation."
}
```

Set `hidden` to `true` to retain an engine setting without showing it. This makes it possible to create a focused configuration—for example, a Schrödinger-specific simulator with a fixed equation and only its relevant controls—without changing React code.

## Shared base and examples

The built-in examples formalize the app's intended split:

- **Simulation**, **Visualization**, the group structure, and the JSON tools form a shared base configuration.
- **Input** and **Model** form the creative layer. An example supplies that layer together with matching settings.

Open **Examples**, directly below **JSON interfaces**, to load a complete pair atomically. The included pairs are the default stochastic damped nonlinear wave (SDNLW), a linear Schrödinger wave packet, a three-component artificial-compressibility Navier–Stokes vortex, and a Life-like cellular automaton. Selecting an example replaces the current configuration and settings, so copy any unsaved custom JSON first.

## Equations

Equation text is GLSL split by `#` characters:

```text
shared statements
#
u_1_tt = u_1_xx + u_1_yy;
#
u_2_tt = u_2_xx + u_2_yy;
```

Text before the first `#` is shared. There must be one following section per field.

## Time integration

`timeOrder` and `integrationMethod` select the temporal model without changing the equation language:

- Time order `1`: each field section assigns `u_i_t`, the derivative of `u_i`.
- Time order `2`: each field section assigns `u_i_tt`; the stored state is `(u_i, u_i_t)`.
- `semiImplicitEuler`: the original SimPDE update. With time order 1 it becomes forward Euler.
- `rk4`: classical four-stage Runge–Kutta evaluated on complete stacked field textures, so coupled fields share every intermediate stage.
- `discrete`: executes direct assignments to `u_i` and `u_i_t` without an automatic integration increment. Cellular automata select this mode.

The original second-order semi-implicit update remains:

```text
u_t = u_t + scaleT * u_tt
u   = u   + scaleT * u_t
```

### Shallow capillary–gravity waves and Poisson rain

The **Shallow capillary–gravity rain** example evolves the small surface elevation
`u_1 = η` in SI units:

```text
η_tt = g h Δη - (σ/ρ) h Δ²η - γ η_t + rain + pointer forcing.
```

For a Fourier mode with wave-number magnitude `k`, this gives
`ω² = g h k² + (σ/ρ) h k⁴`. It is the leading shallow-water (`kh << 1`)
form of the exact finite-depth relation
`ω² = (gk + (σ/ρ)k³) tanh(kh)`. The exact operator is nonlocal in physical
space because it is a non-polynomial Fourier multiplier. The shallow expansion
used here is polynomial in `k²`, so it becomes the local Laplacian plus
biharmonic operator above and fits the finite-difference shader.

The Laplacian uses centered second differences. The biharmonic term is
`u_1_xxxx + 2 u_1_xxyy + u_1_yyyy`, assembled from centered finite-difference
stencils. A second-order semi-implicit Euler step updates velocity before
elevation. Its small default time step is chosen to resolve the stiff `k⁴`
capillary term.

Rain uses rejection thinning for an inhomogeneous space-time Poisson process.
Each time step is split into four sub-bins. In each sub-bin the shader draws a
whole-domain candidate from the homogeneous upper rate `λ_max`, using event
probability `1 - exp(-λ_max area scaleT / 4)`, gives it a uniformly random
position, and accepts it with probability `λ(x,y,t) / λ_max`. Using whole-domain
candidates avoids comparing the 32-bit shader random number with extremely tiny
per-pixel probabilities. The four-bin approximation converges to the target
Poisson process as the time step is reduced. Each accepted event applies a
downward velocity impulse with an optional random drop-size mark.

For a first-order system such as a real/imaginary Schrödinger pair, select time order 1 and RK4, then assign `u_1_t`, `u_2_t`, and so on in the equation sections. RK4 uses additional floating-point work textures and approximately four equation evaluations per simulation step.

Spatial derivatives are generated from names such as `u_1_x`, `u_1_xx`, `u_1_xy`, `u_1_xxx`, and `u_1_t_xy`. The eight immediate neighbours are also available as `u_1_right`, `u_1_left`, `u_1_above`, `u_1_below`, and their diagonal combinations.

## State, initial data, and display

Each floating-point state texture stores:

- red: `u`
- green: `u_t`
- blue: simulation time
- alpha: the configured displayed quantity

Initial data is a JavaScript function returning `[u, u_t]` for every field:

```text
(x, y) => [[Math.exp(-(x*x + y*y) / 100), 0], [0, 0]]
```

Numeric configuration properties may be referenced by name. Displayed quantities use a list such as ``[`u_1`, `u_2_x`]``. Prefix an expression with `1i` to use complex-color rendering.

Boundary conditions are:

- `0`: periodic
- `1`: zero rectangular edge
- `2`: zero circular edge
- `3`: zero vertical edges

## Cellular automata

Select **Life-like cellular automaton** under **Examples**, then enter a rule in **Apply Cellular Automaton Rule**. For example, `B3S23` selects Conway's Game of Life. Applying a rule creates a one-field equation using the same ping-pong texture kernel; mouse or touch input paints live cells. The B/S compiler remains an engine effect, but its control is hidden from ordinary PDE configurations.

## Legacy reference

`script_new.js` is the working pre-React implementation, and `src.zip` preserves the migration-era source snapshot. They are retained as behavioral references and are not part of the active build.
