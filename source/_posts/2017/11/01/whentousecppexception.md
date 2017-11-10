---
title: When and How to Use C++ Exceptions
date: 2017-11-01 13:23:28
tags:
---

Herb answers the question, "When, for what, and how should you use exceptions?

Herb Sutter (http://www.gotw.ca/) is a leading authority and trainer on C++ software development. He chairs the ISO C++ Standards committee and is a Visual C++ architect for Microsoft, where he is responsible for leading the design of C++ language extensions for .NET programming. His two most recent books are Exceptional C++ Style and C++ Coding Standards (available in August and October 2004).

"Error handling is a difficult task for which the programmer needs all the help that can be provided."

—[Stroustrup94] 16.2

When, for what, and how should you use exceptions instead of error codes to report errors?" In this column, I propose a clear and practical answer that builds on previous work (see "References").

Over the years, I've often seen the advice, "Use exceptions for exceptional conditions." But I've also often pointed out that, although this advice is well intentioned, in practice it's trite and unsatisfying, unclear and ambiguous—a nonanswer. Why? The main problem is that "exceptional" is neither objective nor measurable, which means it just leaves open exactly the same set of questions we had when we started, and only rephrases the interpretational question from "when and for what should you use exceptions?" to "okay, fine, so then what's 'exceptional'?"

To come up with a clearly understandable and unambiguous prescriptive answer, we have to nail down three things:

* We need a strict, objective, and measurable definition for what errors are. We also need guidance on where they should be reported and handled.
* We need clear and understandable safety guarantees we can use to describe error handling.
* Finally, we need to see what errors should be reported and handled using exceptions.

For the first two, I'm not going to talk about exceptions specifically at all, but about error handling and safety guarantees in general. This is to highlight and emphasize that exceptions are just one of several equivalent mechanisms we can choose for reporting and handling errors. Only in the final section will I return to exceptions specifically and argue, hopefully persuasively, why you should prefer to use exceptions over error codes wherever possible, and point out the few cases where it isn't possible.

**Distinguish Between Errors and Nonerrors**

The summary: A function is a unit of work, and failures should be viewed as errors or otherwise based on their impact on functions. Within a function f, a failure is an error if and only if it prevents f from meeting any of its callees' preconditions, achieving any of f's own postconditions, or reestablishing any invariant that f shares responsibility for maintaining. (In particular, here I don't consider programming mistakes, which are a separate category and are normally dealt with using assertions.)

It is crucial to crisply distinguish between errors and nonerrors in terms of their effects on functions before we can reason correctly about particular error-handling methods (e.g., exceptions versus error codes) and techniques (e.g., safety guarantees). The key words in this section are precondition, postcondition, and invariant.

The function is the basic unit of work, no matter whether you are programming C++ in a structured style, an OO style, or a generic style. A function makes assumptions about its starting state (documented as its preconditions, which the caller is responsible for fulfilling) and performs one or more actions (documented as its results or postconditions, which the function as callee is responsible for fulfilling). A function may share responsibility for maintaining one or more invariants. In particular, a mutating member function is by definition a unit of work on its object, and must take the object from one valid invariant-preserving state to another; during the body of the member function, the object's invariants can be (and nearly always must be) broken and that is fine and normal as long as they are reestablished by the end of the member function. Higher level functions compose lower level functions into larger units of work.

An error is any failure that prevents a function from succeeding. There are therefore three main kinds of error:

* A condition that prevents the function from meeting a precondition (for example, a parameter restriction) of another function that must be called.
* A condition that prevents the function from establishing one of its own postconditions. If the function has a return value, then producing a valid return value object is a postcondition.
* A condition that prevents the function from reestablishing an invariant that it is responsible for maintaining. This is a special kind of postcondition that applies particularly to member functions; an essential postcondition of every nonprivate member function is that it must reestablish its class's invariants. (See [Stroustrup00] E.2.)

Any other condition is not an error and should not be reported as an error.

The code that could cause an error is responsible for detecting and reporting the error. In particular, this means that the caller is responsible for detecting and reporting a to-be-called function's parameter precondition violations. If the caller fails to do so, it is a programming mistake; **therefore, when the parameter precondition violation is detected inside the called function, it can be dealt with using an assertion**.

Consider some examples:

#### Example 1
`std::string::insert` (precondition error). When trying to insert a new character into a string at a specific position pos, an invalid value of pos (greater than size) violates a documented parameter requirement and is, therefore, an error. The function can't perform its work successfully if it doesn't have a valid starting point.

#### Example 2
`std::string::append` (postcondition error). When appending a character to a string, failure to allocate a new buffer if the existing one is full prevents the operation from performing its documented function and achieving its documented postconditions, and is, therefore, an error.

#### Example 3

Inability to produce a return value (postcondition error). For a value-returning function, producing a valid object to return is a postcondition. If the return value cannot be correctly created (for example, if the function returns a double, but there exists no double value with the mathematical properties requested of a result), that is an error.

#### Example 4
`std::string::find_first_of` (not an error in the context of string). When searching for a character in a string, failure to find the character is a legitimate outcome and not an error. At least, it is not an error as far the general-purpose string class is concerned; if the owner of the given string assumed the character would be present and its absence is thus an error according to a higher level invariant, that higher level calling code would then appropriately report an error with respect to its invariant.

Report an error wherever a function detects an error that it cannot deal with itself and that prevents it from continuing in any form of normal or intended operation. Handle an error in the places that have sufficient knowledge to handle the error, to translate it, or to enforce boundaries defined in the error policy (such as on main and thread mainlines).

Now that we have a crisp definition of what an error is and when to report and handle it, what guarantees can and should we provide for robust error reporting and handling?

**In Each Function, Give the Strongest Safety Guarantee that Won't Penalize Callers Who Don't Need It, But Always Give at Least the Basic Guarantee**

The summary:
* Ensure that errors always leave your program in a valid state. This is the basic guarantee. Beware of invariant-destroying errors (including, but not limited to, leaks), which are just plain bugs.
* Prefer to additionally guarantee that the final state is either the original state (if there was an error the operation was rolled back) or the intended target state (if there was no error the operation was committed). This is the strong guarantee.
* Prefer to additionally guarantee that the operation can never fail at all. Although this is not possible for most functions, it is required for certain functions like destructors, deallocation functions, and swap functions. This is the nofail guarantee.

The basic, strong, and nofail (then known as nothrow) guarantees were originally described in [Abrahams96] and publicized in [GotW], [Stroustrup00] E.2, and [Sutter00] with respect to exception safety, but they apply to all error handling, regardless of the specific method used, so I'll use them to describe error-handling safety in general.

The strong guarantee is a strict superset of the basic guarantee, and the nofail guarantee is a strict superset of the strong guarantee. In general, every function should provide the strongest guarantee that it can without needlessly penalizing calling code that doesn't need the guarantee, and where possible provide enough functionality to allow calling code that needs a still stronger guarantee to achieve that (see the `vector::insert` example).

Ideally, we write functions that always succeed and can, therefore, provide the nofail guarantee. Certain functions must always provide the nofail guarantee, notably destructors, deallocation functions, and swap functions.

Most functions, however, can fail. When errors are possible, the safest way to approach things is to ensure that a function has transactional behavior: Either it totally succeeds and takes the program from one valid state to another valid state, or it fails and leaves the program in the state it was before the call—any object's visible state before the failed call is the same after the failed call (for example, a global int's value won't be changed from "42" to "43") and any action that the calling code would have been able to take before the failed call is still possible with the same meaning after the failed call (for example, no iterators into containers have been invalidated, performing ++ on the aforementioned global int yields "43" not "44"). This is the strong guarantee.

Finally, if providing the strong guarantee is difficult or needlessly expensive, then provide the basic guarantee: Either the function totally succeeds and reaches the intended target state, or it does not completely succeed and leaves the program in a state that is valid (preserves the invariants that the function knows about and is responsible for preserving) but not predictable (it might or might not be the original state, and none, some, or all of the postconditions could be met; but note that all invariants must still be reestablished). The design of your application must prepare for handling that state appropriately.

That's it; there is no lower level. A failure to meet at least the basic guarantee is always a program bug. Correct programs meet at least the basic guarantee for all functions; even those rare correct programs that deliberately leak resources by design, particularly in situations where the program immediately aborts, do so knowing that they will be reclaimed by the operating system. Always structure code so that resources are correctly freed and data is in a consistent state even in the presence of errors (unless the error is so severe that graceful or ungraceful termination is the only option).

#### Example 1
Retry after failure. If your program includes a command for saving data to a file and the write fails, make sure you revert to a state where the user can retry the operation. (One editor's metastable state didn't allow changing the filename to save to after a write error.) In particular, don't release any data structure before data has been safely flushed to disk.

#### Example 2
Skins. If you write a skinnable application, don't destroy the existing skin before attempting to load a new one. If loading the new skin fails, your application might end up in an unusable state.

#### Example 3
`std::vector::insert`. Because `vector<T>`'s internal storage is contiguous, inserting an element into the middle requires shuffling some existing values over by one position to make room for the new element. The shuffling is done using `T::operator=`, and if that can throw, then the only way to make insert provide the strong guarantee is to make a complete copy of the container, perform the operation on the copy, and if successful, swap the original's and copy's state using the nofail `vector<T>::swap`. But if that were done every time by insert itself, then every user of `vector::insert` would always incur the space and performance penalty of making a complete copy of the container, whether it needed the strong guarantee or not. That is needlessly expensive. Instead, those callers who do want the strong guarantee can do the work themselves. (In the best case: Arrange for the contained type to not throw from its copy constructor or copy assignment operators. In the worst case: Take a copy, insert into the copy, and swap the copy with the original when successful.)

#### Example 4
Unfiring a rocket. Consider a function `f` that, as part of its work, fires a rocket, and the `FireRocket` function provides the strong or nofail guarantee. If `f` can perform all of its work that could fail before firing the rocket, it can be coded to provide the strong guarantee. But if it must perform other operations that might fail after having already fired the rocket, then it cannot provide the strong guarantee because it cannot bring the rocket back. (At any rate, such an f probably ought to be split into two functions, because a single function should probably not be trying to do multiple pieces of work of such significance; prefer to give one entity one cohesive responsibility.)

Now we have in hand two key pieces: a crisp definition of what an error is and when to report and handle it, and what guarantees we can and should provide for robust error reporting and handling. Now we can move on to the key question in the final part: When should you use exceptions instead of other techniques (notably error codes) to report errors?

**Prefer to Use Exceptions to Report Errors**

The summary: Prefer using exceptions over error codes to report errors. Use status codes (such as return codes or errno) for errors only when exceptions cannot be used (when you don't control all possible calling code and can't guarantee it will be written in C++ and compiled using the same compiler and compatible compile options so that exception handling will work), and for conditions that are not errors. Use other methods, such as graceful or ungraceful termination, when recovery is not required or is impossible.

It's no coincidence that most modern languages created in the past 20 years use exceptions as their primary (or only) error-reporting mechanism.

Almost by definition, exceptions are for reporting, well, exceptions to normal processing—also known as "errors," defined in the first section as violations of preconditions, postconditions, and invariants. I use the term "status codes" to cover all forms of reporting status via codes (including return codes, errno, GetLastError, and similar strategies to return or retrieve codes), and "error codes" specifically for those status codes that signify errors.

In C++, reporting errors via exceptions has clear advantages over reporting them via error codes, all of which make your code more robust:

* Exceptions can't be silently ignored. The most terrible weakness of error codes is that they are ignored by default; to pay the slightest attention to an error code, you have to explicitly write code to accept the error and respond to it. It is common for programmers to accidentally (or lazily) fail to pay attention to error codes. This makes code reviews harder. Exceptions can't be silently ignored; to ignore an exception, you must explicitly catch it (even if only with catch(...)) and choose not to act on it.
* Exceptions propagate automatically. Error codes are not propagated by default; to inform a higher level calling function of a lower level error code, a programmer writing the intervening code has to explicitly hand-write code to propagate the error. Exceptions propagate automatically by default exactly until they are handled. This directly supports good error handling: "It is not a good idea to try to make every function a fire-wall. The best error-handling strategies are those in which only designated major interfaces are concerned with non-local error handling issues." —[Stroustrup94] 16.8
* Exception handling removes error handling and recovery from the main line of control flow. Error code detection and handling, when it is written at all, is necessarily interspersed with (and therefore obfuscates) the main line of control flow. This makes both the main control flow and the error-handling code harder to understand and maintain. Exception handling naturally moves error detection and recovery into distinct catch blocks; that is, it makes error handling distinctly modular instead of inline spaghetti. This makes the main line of control more understandable and maintainable, and it's more than an aesthetic benefit to distinguish clearly between correct operation and error detection and recovery.
* Exception handling is better than the alternatives for reporting errors from constructors and operators. Constructors and operators in particular have predefined signatures that leave no room for return codes. In particular, constructors have no return type at all (not even void) and, for example, every `operator+` must take exactly two parameters and return one object. For operators, using error codes is at least possible if not desirable; it would require errno-like approaches, or inferior solutions such as packaging status with an object. For constructors, using error codes is not feasible because the C++ language tightly binds together constructor exceptions and constructor failures so that the two have to be synonymous; if instead we used an `errno`-like approach, such as

```cpp
SomeType anObject;  // construct an object
if( SomeType::ConstructionWasOk() ) {	
     // test whether construction worked
// ...
```

then not only is the result difficult to use and error-prone, but it leads to misbegotten objects that exist but don't actually satisfy their type's invariants—never mind the race conditions inherent in calls to `SomeType::ConstructionWasOk` in multithreaded applications. (See [Stroustrup00] E.3.5.) 

The main potential drawback of exception handling is that it requires programmers to be familiar with a few recurring idioms that arise from exceptions' out-of-band control flow. For example, destructors and deallocation functions must not throw, and intervening code must be correct in the face of exceptions (see References); to achieve the latter, a common coding idiom is to perform all the work that might emit an exception safely off to the side and only then, when you know that the real work has succeeded, you commit and modify the program state using nonthrowing operations only (see Guru of the Week, Items 9, 10, and 13). But then, using error codes also has its own idioms; those have just been around longer and so more people already know them—but, unfortunately, also commonly and routinely ignore them. Caveat emptor.

Performance is not normally a drawback of exception handling. First, note that you should always turn on exception handling in your compiler even if it is off by default; otherwise, you won't get standard behavior and error reporting from the C++ language (`operator new`, for instance) and Standard Library (STL container insertions). [Note: Turning on exception handling can be implemented so that it increases the size of your executable image (this part is unavoidable) but incurs zero or near-zero performance overhead in the case where no exception is thrown, and some compilers do so, although some popular ones do not. This is irrelevant to the performance of using exceptions versus error codes because it is about turning on your compiler's support for doing any exception handling at all—and that should always be turned on, otherwise the language and Standard Library won't report errors correctly.] Once your compiler's support for exception handling is turned on, the performance difference between throwing an exception and returning an error code is typically negligible in normal processing (the case where no error occurs). You may notice a performance difference in the case where an error does occur, but if you're throwing so frequently that the exception throwing/catching handling performance overhead is actually noticeable, you're almost certainly using exceptions for conditions that are not true errors and, therefore, not correctly distinguishing between errors and nonerrors (see the first section). If they're errors that truly violate pre- and postconditions and invariants, and if they're really happening that frequently, then the application has much more serious problems.

One symptom of error code overuse is when application code needs to check relentlessly for trivially true conditions, or (worse) fails to check error codes that it should check.

One symptom of exception overuse is when application code throws and catches exceptions so frequently that a catch block is executed nearly as frequently as its try block completes successfully (for example, more than, say, 10 percent of attempts to execute the try block result in exceptions being thrown). Such a catch block is either not really handling a true error (one that violates preconditions, postconditions, or invariants), or the program is in serious trouble.

For instance, see the examples in the first section, replacing "report an error" with "throw an exception." Here are two more:

#### Example 1
Constructors (invariant error). If a constructor cannot successfully create an object of its type, which is the same as saying that it cannot establish all of the new object's invariants, it should throw an exception. Conversely, an exception thrown from a constructor always means that the object's construction failed and the object's lifetime never began; the language enforces this.

#### Example 2
Successful recursive tree search. When searching a tree using a recursive algorithm, it can be tempting to return the result (and conveniently unwind the search stack) by throwing the result as an exception. But an exception means an error, and finding the result is not an error. (Note that, of course, failing to find the result is also not an error in the context of the search function; see the `find_first_of` example.)

In rare cases, where you know that:
* The benefits of exceptions don't apply (for example, you know that nearly always the immediate caller must directly handle the error and so propagation should happen either never or nearly never; this is very rare because usually the callee does not have this much information about the characteristics of all of its callers), and
* The actual measured performance of throwing an exception over using an error code matters (for example, the performance difference is measured empirically, so you're probably in an inner loop and throwing often; the latter is rare because it usually means the condition is not really an error after all, but let's assume that somehow it is), hen consider using an error code.

### Summary

Distinguish between errors and nonerrors. A failure is an error if and only if it violates a function's ability to meet its callees' preconditions, to establish its own postconditions, or to reestablish an invariant it shares responsibility for maintaining. Everything else is not an error.

Ensure that errors always leave your program in a valid state; this is the basic guarantee. Beware of invariant-destroying errors (including, but not limited to, leaks), which are just plain bugs.

Prefer to additionally guarantee that either the final state is either the original state (if there was an error, the operation was rolled back) or intended target state (if there was no error, the operation was committed); this is the strong guarantee.

Prefer to additionally guarantee that the operation can never fail. Although this is not possible for most functions, it is required for functions such as destructors and deallocation functions.

Finally, prefer to use exceptions instead of error codes to report errors. Use error codes only when exceptions cannot be used (when you don't control all possible calling code and can't guarantee it will be written in C++ and compiled using the same compiler and compatible compile options), and for conditions that are not errors.

### Acknowledgments
hanks to Dave Abrahams, Andrei Alexandrescu, Scott Meyers, and Bjarne Stroustrup for their comments on and contributions to this article. This material is drawn from the new book C++ Coding Standards, coauthored by me and Andrei Alexandrescu, available October 2004.

### References
1. [Abrahams96] D. Abrahams. "Exception Safety in STLport" (STLport web site, 2001). Available online at http://www.stlport.org/ doc/exception_safety.html.
2. [Abrahams01] D. Abrahams. "Error and Exception Handling" (Boost web site, 2001). Available online at http://www.boost.org/ more/error_handling.html.
3. [Alexandrescu03] A. Alexandrescu and D. Held. "Smart Pointers Reloaded" (C/C++ Users Journal, 21(10), October 2003). Available at http://www.moderncppdesign .com/publications/cuj-10-2003.html.
4. [Stroustrup94] B. Stroustrup. The Design and Evolution of C++ (Addison-Wesley, 1994).
5. [Stroustrup00] B. Stroustrup. The C++ Programming Language, Special Edition (Addison-Wesley, 2000). Note in particular the exception safety appendix, also available online at http://www.research.att.com/~bs/ 3rd_safe0.html.
6. [SuttAlex05] H. Sutter and A. Alexandrescu. C++ Coding Standards (available in October 2004; Addison-Wesley, 2005).
7. [Sutter00] H. Sutter. Exceptional C++ (Addison-Wesley, 2000), Items 8-19, 40, 41, and 47.
8. [Sutter02] H. Sutter. More Exceptional C++ (Addison-Wesley, 2002), Items 17-23.
9. [Sutter04] H. Sutter. Exceptional C++ Style (available in August 2004; Addison-Wesley, 2004), Items 11, 12, and 13.


