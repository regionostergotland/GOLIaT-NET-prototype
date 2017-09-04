using System;
using System.Linq;
using System.Security.Claims;
using System.Security.Principal;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Configuration;
using System.Web.Mvc;

namespace RO.Common.Filters
{
    // Filterattribut som sätter globala ViewBag-variabler, ska användas i alla controllers
    public class VariablesFilterAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var viewBag = filterContext.Controller.ViewBag;

            // Hämta från IDP, om applikationen är konfigurerad för det
            //viewBag.PageUserName = "Carlos Ortiz"; // filterContext.HttpContext.User.Identity.Name;
            //viewBag.PageUserSign = "6OTD"; // GetWindowsAccountName(filterContext.HttpContext.User);

            GetWindowsAccountName(filterContext.HttpContext.User);

            viewBag.PageUserName = filterContext.HttpContext.User.Identity.Name;
            viewBag.PageUserSign = GetWindowsAccountName(filterContext.HttpContext.User);
            //viewBag.PageUserRole = HttpContext.Current.Request.QueryString["Role"];

            //if (HttpContext.Current.Session["Role"] == null)
            //{
            //    HttpContext.Current.Session["Role"] = "Ledning";
            //}
            //else
            //{
            //    string roleString = HttpContext.Current.Request.QueryString["Role"];
            //    if (HttpContext.Current.Session["Role"] == roleString)
            //    {
            //        viewBag.PageUserRole = HttpContext.Current.Session["Role"];

            //    }
            //    else
            //    {
            //       HttpContext.Current.Session["Role"] = HttpContext.Current.Request.QueryString["Role"];
            //    }
            //}
            
            
            //if (viewBag.PageUserRole == null || string.IsNullOrEmpty(viewBag.PageUserRole))
            //{
            //    viewBag.PageUserRole = "Ledning";
            //}

            if(HttpContext.Current.Session["ROLE"] == null )
            {
                HttpContext.Current.Session["ROLE"] = "Ledning";
               // HttpContext.Current.Request.QueryString["Role"] = "Ledning";
            }
            else
            {
                if (HttpContext.Current.Request.QueryString["Role"] == null)
                {
                    //HttpContext.Current.Session["ROLE"] = "";
                }
                else
                {
                    HttpContext.Current.Session["ROLE"] = HttpContext.Current.Request.QueryString["Role"];
                }
            }



            viewBag.PageMenuHeader = Setting("RO.PageMenuHeader");
           
            viewBag.PageApplicationName = "GOLIAT"; //Setting("RO.PageApplicationName");

            if (HttpContext.Current.Request.QueryString["EHRID"] != null)
            {
                viewBag.CurrentEhrID = HttpContext.Current.Request.QueryString["EHRID"];
            }
            viewBag.CurrentPatient = ""; //Setting("RO.PageApplicationName");
            viewBag.PageApplicationIcon = ""; //Setting("RO.PageApplicationIcon");

            viewBag.PageLayoutSkin = Setting("RO.PageLayoutSkin");
            viewBag.PageLayoutOption = Setting("RO.PageLayoutOption");
            viewBag.Title = "GOLIAT";
            
            HandleEHRSession();

            //bool isAllowed = HasApplicationOperation(filterContext.HttpContext.User);

            //if (!isAllowed)
            //{
             //   filterContext.Result = new RedirectResult("http://www.google.se");
            //}
        }
        private void HandleEHRSession()
        {
            Guid guidOutput;
            string ehrGUID = HttpContext.Current.Request.QueryString["EHRID"];

            bool isValid = Guid.TryParse(ehrGUID, out guidOutput);

            if (isValid)
                HttpContext.Current.Session["EHRID"] = HttpContext.Current.Request.QueryString["EHRID"];                        
        }

        private static Regex isGuid = new Regex(@"^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$", RegexOptions.Compiled);

        internal static bool IsGuid(string candidate, out Guid output)
        {
            bool isValid = false;
            output = Guid.Empty;
            if (candidate != null)
            {

                if (isGuid.IsMatch(candidate))
                {
                    output = new Guid(candidate);
                    isValid = true;
                }
            }
            return isValid;
        }


        private string GetWindowsAccountName(IPrincipal user)
        {
            string windowsAccountName = null;

            var claim = (user.Identity as ClaimsIdentity).Claims.FirstOrDefault(p =>
                p.Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/windowsaccountname");

            if (claim != null)
            {
                windowsAccountName = claim.Value;
            }
            else
            {
                windowsAccountName = "Anonym användare";
            }

            return windowsAccountName;
        }

        private bool HasApplicationOperation(IPrincipal user)
        {
            int operation = 9200;

            return (user.Identity as ClaimsIdentity).Claims.Any(p =>
                p.Type == "http://regionostergotland.se/2015-03/Heimdall/Operation"
                && p.Value == operation.ToString());
        }

        private string Setting(string key)
        {
            string value = WebConfigurationManager.AppSettings[key];
            return value;
        }
    }
}