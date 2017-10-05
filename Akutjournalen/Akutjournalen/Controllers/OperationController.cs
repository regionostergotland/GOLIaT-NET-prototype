using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Converters;
using Json;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using Goliat.Models;
using System.Diagnostics;

namespace Goliat.Controllers
{
    public class OperationController : Controller
    {
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {

            @ViewBag.PageHeader = "Operationer";
            @ViewBag.SubPageHeader = "Urologkliniken";
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "Administrator";
        }
        

        public ActionResult Index()
        {
            return View();
        }


        // Get all the operations from JSON file.
        [HttpPost]
        public String GetOperationer() {
            string path = Server.MapPath("~/Content/patientJson/operationer.txt");
            String file = System.IO.File.ReadAllText(path);

            return file;
        }
        

    }
}