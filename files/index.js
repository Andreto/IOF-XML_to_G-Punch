var readXml=null;
$('#xml-form').submit(function(event) {
    event.preventDefault();
    var selectedFile = document.getElementById('xml-input').files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        readXml=e.target.result;
        var parser = new DOMParser();
        var doc = parser.parseFromString(readXml, "application/xml");
        var epsgCode = document.getElementById('epsg-input').value;
        processXML(doc, epsgCode);
    }
    reader.readAsText(selectedFile);
});

var pointNames = ["StartPoint", "FinishPoint", "Control"];

function processXML(doc, epsgCode) {


    // Collect Control Points
    let pointData = "";
    for (let i = 0; i < pointNames.length; i++) {
        let objects = doc.getElementsByTagName(pointNames[i]);
        for (let ii = 0; ii < objects.length; ii++) {
            let cId = objects[ii].getElementsByTagName(pointNames[i] + "Code")[0].innerHTML;
            let cPos = objects[ii].getElementsByTagName("ControlPosition")[0]
            let cord = proj4(epsgDef["EPSG:" + epsgCode], epsgDef["EPSG:4326"], [parseInt(cPos.getAttribute("x")), parseInt(cPos.getAttribute("y"))])
            pointData += (cId + "," + cord[1] + "," + cord[0] + ";");
        }
    }
    console.log(pointData)
    document.getElementById("point-data-output").innerText = pointData;

    // Collect Course Data
    let courseData = {};
    let courses = doc.getElementsByTagName("Course");
    let courseNames = [];

    console.log(courses);

    for (let i = 0; i < courses.length; i++) {
        let course = JSON.parse(xml2json(courses[i], " ")).Course;
        courseNames.push(course.CourseName);
        let controls = course.CourseVariation.StartPointCode + ";";
        for (let ii = 0; ii < course.CourseVariation.CourseControl.length; ii++) {
            controls += (course.CourseVariation.CourseControl[ii].ControlCode + ";");
        }
        controls += (course.CourseVariation.FinishPointCode + ";");

        courseData[course.CourseName] = {
            "controls": controls,
            "length": parseInt(course.CourseVariation.CourseLength)
        };
    }
    console.log(courseData);

    for (let i = 0; i < courseNames.length; i++) {
        let course = courseData[courseNames[i]];
        console.log(courseNames[i], course.length + "m");
        $("#course-data-insert").append(
            "<h4>" + courseNames[i] + ", " + course.length + "m" + "</h4>" +
            "<textarea>" + course.controls + "</textarea>"
        );
    }

}