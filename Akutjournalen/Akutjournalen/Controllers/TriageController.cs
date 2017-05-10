using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Akutjournalen.Controllers
{
    public class TriageController : Controller
    {


        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Utredning";
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

        public ActionResult NyUtredning()
        {
            return View();
        }
        public ActionResult RedigeraUtredning()
        {
            return View();
        }
	}
}