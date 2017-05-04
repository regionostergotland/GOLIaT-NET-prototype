using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Akutjournalen.Controllers
{
    public class SlutAnteckningController : Controller
    {
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Ledningsvy";
            @ViewBag.SubPageHeader = "Urologkliniken";
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "";        // Skall vi göra en session av denna eller en global class eller hanteras i bas controll, innehåll skall hantera vid login ?
        }

        // GET: SlutAnteckning
        public ActionResult Index()
        {
            return View();
        }
    }
}