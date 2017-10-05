using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Goliat.Models;

namespace Goliat.Controllers
{
    public class UtredningController : Controller
    {
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Utredning och beslut";
            @ViewBag.SubPageHeader = "Urologkliniken";
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "";
        }
        //
        // GET: /Triage/
        public ActionResult Index()
        {
        
            return View();
        }

        public ActionResult SpecificUnderlag()
        {

            return View();
        }
        public ActionResult ViewForm()
        {
            @ViewBag.PageHeader = "Forms";
            return View();
        }
    }
}