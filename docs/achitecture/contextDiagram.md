
# Architectuur

## C4 Context Diagram

The context diagram shows the system under consideration as a single block, together with all external systems that interact with it. The diagram provides a high-level view of the system and its environment, and is typically used to communicate the system's boundaries and scope.

```mermaid
C4Context
    Person(Employee, "Employee", "An employee of a municipality")

    Enterprise_Boundary(o, "Employee Workspace") {
        System_Boundary(word, "Microsoft Word") {
            System(WordApp, "Microsoft Word Application")
            System(WordWebApp, "Microsoft Word Web Application")
            System(WordAddIn, "ZGW Office Add-In")
        }
    }

    Enterprise_Boundary(b0, "Applications Platform") {
        System(OfficeProxy, "ZGW Office Frontend Proxy")
        System(OfficeService, "ZGW Office Backend Service")
        System(Objecten, "Objecten API")
        System(OpenZaak, "ZGW API")
    }

    Rel(Employee, WordApp, "<use>")
    Rel(Employee, WordWebApp, "<use>")
    Rel(WordApp, WordAddIn, "<include>")
    Rel(WordWebApp, WordAddIn, "<include>")
    Rel(WordAddIn, OfficeProxy, "<use>")
    Rel(OfficeProxy, OfficeService, "<redirect>")
    Rel(OfficeService, Objecten, "<use>")
    Rel(OfficeService, OpenZaak, "<use>")

    UpdateElementStyle(WordAddIn, $bgColor="red", $borderColor="red")
    UpdateElementStyle(OfficeProxy, $bgColor="red", $borderColor="red")
    UpdateElementStyle(OfficeService, $bgColor="red", $borderColor="red")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```
