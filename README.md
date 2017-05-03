# Kaleidoscope
Primary functional programming interpreter

## Does it support branch like "if" "while" "for", etc?
Sorry, not now. Thereby *Kaleidoscope* is not turing-complete.

## What operators can we use for calculation?
Currently, we have the following ops:
unary: +, -
binary: +, -
assignment: =
precedence: (, )
function argument: ,(comma)

## Is there any build-in constants or functions to apply?
Yes, of cource.
Right now, you can use *pi* and *e* and many other frequently used functions like *sin*, *abs* and so on and so forth.

# Does it have any type system?
Uh-ha, we are considering this to be future work.
Right now in *Kaleidoscope* every literal is a 64-bit numeric floating point number.

# What can be a valid identifier name?
[a-zA-Z][a-zA-Z0-9]\*

# Any tips on getting hands dirty for *Kaleidoscope*?
There are a few things I hope you to notice:
Variables and functions are both first-class citizen in *Kaleidoscope*, the major difference between them is that variables needs to be evaluated immediately when defined, whereas functions can be lazily evaluated upon being called.
For instance, when you define the function *foo*, like this:
foo(a) = a
computer has no idea what *a* is, but it allows it to be ambiguous.
If we set the variable *foo* to be *a*, computer must ask what *a* is until *a* is defined as a concrete value.

Functions are just a constrained form of variables. Consider the following example:
f() = 0.0
g = 0.0
They are just the same, i.e. a fixed-point on Euclidean space.
f(k, b) = k * 10 + b
g = x * 10 + y
The former is constrained by parameter *k* and *b*. Only if they are set this function can be evaluated. However, the latter must know *x* and *y* so as to obtain the value of *g*. Just bear in mind, functions are those that store whole process in memory, in which case, we call it a closure.

# Any else?
Hope you enjoy it!
