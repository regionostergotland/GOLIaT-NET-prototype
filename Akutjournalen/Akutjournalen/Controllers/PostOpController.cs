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
    public class PostOpController : Controller
    {
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "PostOp.";
            @ViewBag.SubPageHeader = "Urologkliniken";
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "Administrator";
        }
        // GET: PostOp
        public ActionResult Index()
        {
            return View();
        }

        // Get all the postoperations from JSON file.
        [HttpPost]
        public String GetPostOp()
        {
            string path = Server.MapPath("~/Content/patientJson/postop.txt");
            String file = System.IO.File.ReadAllText(path);
            return file;
        }

    }
}