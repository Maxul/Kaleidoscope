# *Kaleidoscope* - Primary Functional Programming Interpreter

### Does it support branches or loops like "*if*" "*while*" "*for*", etc?
Sorry, not yet. Thus *Kaleidoscope* is not **turing-complete**.

### What operators can be used for calculation?
Currently, *Kaleidoscope* supports the following operators:
- unary: + -
- binary: + -
- assignment: =
- precedence: ( )
- argument separator: ,

### Is there any built-in constants or functions to use?
Yes, of cource.  
Right now, you can use *pi* and *e* and many other frequently used functions like *sin()*, *abs()* and so forth.

### Does *Kaleidoscope* apply any type system?
Uh-huh, we are considering this to be a future work.  
Right now in *Kaleidoscope* every literal is a 64-bit double precision floating point numeric.

### What can be a valid identifier name?
[a-zA-Z][a-zA-Z0-9]\*

### Any tips on getting hands dirty on *Kaleidoscope*?
There are a couple of things that we hope you to notice:  
**Variables** and **functions** are both first-class citizens in *Kaleidoscope*. The major difference is that variables, when defined, needs to be evaluated immediately, whereas functions can be lazily evaluated upon being called.  
For instance, when you define the function *foo*, like below:
> foo(a) = a  

Computer has no idea what *a* is, but it allows it to be ambiguous.  
If we set the variable *foo* to be *a*, computer must ask for what *a* is until *a* is defined as a concrete value.

Functions are merely a constrained form of variables. Consider the following example:
> f() = 0.0  
> g = 0.0  

They are just the same, i.e. a fixed point in Euclidean space.
> f(k, b) = k * 10 + b  
g = x * 10 + y  

The former is constrained by parameter *k* and *b*. Only when they are set, this function can be evaluated successfully. However, the latter must know *x* and *y* so as to obtain the value of *g*.  
Just bear in mind, functions are those that store whole process in memory, in which case, we call it a **closure**.

### Anything else?
Nope, we hope you **enjoy** it!
