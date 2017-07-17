using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Akutjournalen.Models;



namespace Akutjournalen.Controllers
{
    public class UnderlagController : Controller
    {
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Beslutsunderlag";
            @ViewBag.SubPageHeader = "Urologkliniken";
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "";        // Skall vi göra en session av denna eller en global class eller hanteras i bas controll, innehåll skall hantera vid login ?
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
    }
}