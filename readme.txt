=== Co2 Footprint Widget ===
Contributors: pacesupport
Donate link: -
Tags: 1.1.8
Requires at least: 5.7
Tested up to: 6.5
Stable tag: 1.1.8
Requires PHP: 7.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

PACE Passenger (PAX) Widget is a service that retrieves flights CO2 footprint, including seating configuration and emissions equivalents and offsets.

== Description ==

The PACE Passenger (PAX) Widget is a service designed to be easily embedded within a website to calculate the total CO2 footprint of a flight. Using travel information input by the user, the widget
provides:

* highly accurate emissions metrics (CO2 (kg))
* seating configuration of the route’s most popular aircraft
* carbon emissions equivalents and offsets, to provide relatable comparisons between your flights emissions and emissions produced by every-day events.

The flight data used to calculate CO2 emissions in the Widget is based on a rolling 12-month window to ensure that the emissions reported are reflective of the ever-changing aircraft fleet deployed by the world’s airlines. As an example, if an airline starts to place new generation aircraft on select routes the widget will, in time, reflect reduced emissions per passenger on that route for the airline.

In order to provide co2 footprint values per flight, the plugin makes use of a few external services to operate accordingly. Each one of the services and their responsibilities are described below.

* /co2footprint/calculate Returns C02 Footprint calculations based on provided Flight number or flight details (airline and origin/destination airports) so that they can be presented in the widget.
* /co2footprint/airlines Returns available airlines so that Airline input field can be populated with selectable values.
* /co2footprint/airports Returns available airport so that Origin and Destination input fields can be populated with selectable values.

Further information regarding widget usage and metrics calculations can be found at the 'PACE PAX Widget Methodology' document described below.

== Frequently Asked Questions ==

= How can I get a valid Api key? =

Contact Pace customer support at [Pace website](https://www.pace-esg.com/)

= Is there any explanation on how those flight metrics are calculated?

You can get extra information on our metrics and methodology in the 'PACE PAX Widget Methodology' document. Our customer team can share this with you alongside your valid API key.

== Screenshots ==


== Changelog ==

= 1.1.8 =
* Minor code improvements
* Plugin released
