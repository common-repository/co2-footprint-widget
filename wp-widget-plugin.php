<?php

/*
Plugin Name: CO2 Footprint Widget
Description: Calculates CO2 Footprint values for flight routes
Version: 1.1.8
Author: Fexco
License: GPL2
I
*/
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly
add_action('wp_enqueue_scripts', 'co2footprint_loadWidgetEsm');
add_action('wp_enqueue_scripts', 'co2footprint_loadWidgetJs');
add_filter('script_loader_tag', 'co2footprint_addModuleType', 10, 3);

add_action('admin_enqueue_scripts', 'co2footprint_EnqueueColorPicker');
function co2footprint_EnqueueColorPicker()
{
  wp_enqueue_style('coloris-css', plugin_dir_url(__FILE__) . 'coloris.css');
  wp_enqueue_style('coloris-display', plugin_dir_url(__FILE__) . 'coloris-display.css');
  wp_enqueue_script('coloris-js', plugin_dir_url(__FILE__) . 'coloris.js');
}

function co2footprint_loadWidgetEsm()
{
  wp_enqueue_script('pace-carbon-calculator-widget-esm',
    plugin_dir_url(__FILE__) . 'build/pace-carbon-calculator-widget.esm.js');
}

function co2footprint_loadWidgetJs()
{
  wp_enqueue_script('pace-carbon-calculator-widget-js',
    plugin_dir_url(__FILE__) . 'build/pace-carbon-calculator-widget.js');
}

function co2footprint_addModuleType($tag, $handle, $src)
{
  if ('pace-carbon-calculator-widget-esm' === $handle) {
    return wp_get_script_tag(
      array(
        'src'      => esc_url($src) ,
        'type' => "module",
      )
    );
  } elseif ('pace-carbon-calculator-widget-js' === $handle) {
    return wp_get_script_tag(
      array(
        'src'      => esc_url($src) ,
        'nomodule' => true,
      )
    );
  }
  return $tag;
}

class Co2FootprintWidget extends WP_Widget
{

  // Main constructor
  public function __construct()
  {
    parent::__construct(
      'co2_footprint_widget',
      __('CO2 Footprint Widget', 'text_domain'),
      array('customize_selective_refresh' => true,
      )
    );
  }

  // The widget form (for the backend )
  public function form($instance)
  {

    // Set widget defaults
    $defaults = array(
      'apikey' => '',
      'showEquivalents' => '',
      'landscapeMode' => '',
      'containerMaxWidth' => '',
      'applyLoadFactor' => '',
      'fontFamily' => '',
      'primaryColor' => '',
      'secondaryColor' => '',
      'primaryBackgroundColor' => '',
      'secondaryBackgroundColor' => '',
      'selectedColor' => '',
    );

    $checked = "checked";

    // Parse current settings with defaults
    extract(wp_parse_args((array)$instance, $defaults)); ?>

    <?php // Widget Api-Key
    ?>
    <p>
      <div>
        <label for="<?php echo esc_attr($this->get_field_id('apikey')); ?>">
          <?php esc_html_e('Widget Api-Key', 'text_domain'); ?>
        </label>
        <input class="widefat" id="<?php echo esc_attr($this->get_field_id('apikey')); ?>"
               name="<?php echo esc_attr($this->get_field_name('apikey')); ?>" type="text"
               value="<?php echo esc_attr($apikey); ?>" />
      </div>

      <hr/>

      <div>
        <label for="<?php echo esc_attr($this->get_field_id('landscapeMode')); ?>">
          <?php esc_html_e('Landscape mode', 'text_domain'); ?>
        </label>
        <input class="widefat" id="<?php echo esc_attr($this->get_field_id('landscapeMode')); ?>"
               type="checkbox"
               name="<?php echo esc_attr($this->get_field_name('landscapeMode')); ?>"
               <?php if ($landscapeMode) echo esc_attr($checked); ?> />
      </div>

      <div>
        <label for="<?php echo esc_attr($this->get_field_id('containerMaxWidth')); ?>">
          <?php esc_html_e('Container width (value in px, percentage with %, or none):', 'text_domain'); ?>
        </label>
        <input class="widefat" id="<?php echo esc_attr($this->get_field_id('containerMaxWidth')); ?>"
               name="<?php echo esc_attr($this->get_field_name('containerMaxWidth')); ?>" type="text"
               value="<?php echo esc_attr($containerMaxWidth); ?>" />
      </div>

      <hr/>

      <div>
        <label for="<?php echo esc_attr($this->get_field_id('showEquivalents')); ?>">
          <?php esc_html_e('Show equivalent metrics', 'text_domain'); ?>
        </label>
        <input class="widefat" id="<?php echo esc_attr($this->get_field_id('showEquivalents')); ?>"
               type="checkbox"
               name="<?php echo esc_attr($this->get_field_name('showEquivalents')); ?>"
                <?php if ($showEquivalents)  esc_attr($checked); ?> />
      </div>

      <div>
        <label for="<?php echo esc_attr($this->get_field_id('applyLoadFactor')); ?>">
          <?php esc_html_e('Apply IATA Load Factor', 'text_domain'); ?>
        </label>
        <input class="widefat" id="<?php echo esc_attr($this->get_field_id('applyLoadFactor')); ?>"
               type="checkbox"
               name="<?php echo esc_attr($this->get_field_name('applyLoadFactor')); ?>"
          <?php if ($applyLoadFactor) echo esc_attr($checked); ?> />
      </div>

      <hr/>

      <div>
        <label for="<?php echo esc_attr($this->get_field_id('primaryColor')); ?>">
          <?php esc_html_e('Primary Color', 'text_domain'); ?>
        </label>
        <input data-coloris class="color-picker" id="<?php echo esc_attr($this->get_field_id('primaryColor')); ?>"
               name="<?php echo esc_attr($this->get_field_name('primaryColor')); ?>" type="text"
               value="<?php echo esc_attr($primaryColor); ?>" data-default-color="#2d9395" />

        <label for="<?php echo esc_attr($this->get_field_id('secondaryColor')); ?>">
          <?php esc_html_e('Secondary Color', 'text_domain'); ?>
        </label>
        <input data-coloris class="color-picker" id="<?php echo esc_attr($this->get_field_id('secondaryColor')); ?>"
               name="<?php echo esc_attr($this->get_field_name('secondaryColor')); ?>" type="text"
               value="<?php echo esc_attr($secondaryColor); ?>" data-default-color="#435266" />

        <label for="<?php echo esc_attr($this->get_field_id('primaryBackgroundColor')); ?>">
          <?php esc_html_e('Primary Background Color', 'text_domain'); ?>
        </label>
        <input data-coloris class="color-picker"
               id="<?php echo esc_attr($this->get_field_id('primaryBackgroundColor')); ?>"
               name="<?php echo esc_attr($this->get_field_name('primaryBackgroundColor')); ?>" type="text"
               value="<?php echo esc_attr($primaryBackgroundColor); ?>" data-default-color="#f2f6f4" />

        <label for="<?php echo esc_attr($this->get_field_id('secondaryBackgroundColor')); ?>">
          <?php esc_html_e('Secondary Background Color', 'text_domain'); ?>

        </label>
        <input data-coloris class="color-picker"
               id="<?php echo esc_attr($this->get_field_id('secondaryBackgroundColor')); ?>"
               name="<?php echo esc_attr($this->get_field_name('secondaryBackgroundColor')); ?>" type="text"
               value="<?php echo esc_attr($secondaryBackgroundColor); ?>" data-default-color="#ffffff" />

        <label for="<?php echo esc_attr($this->get_field_id('selectedColor')); ?>">
          <?php esc_html_e('Selected Color', 'text_domain'); ?>
        </label>
        <input data-coloris class="color-picker" id="<?php echo esc_attr($this->get_field_id('selectedColor')); ?>"
               name="<?php echo esc_attr($this->get_field_name('selectedColor')); ?>" type="text"
               value="<?php echo esc_attr($selectedColor); ?>" data-default-color="#dddddd" />

        <label for="<?php echo esc_attr($this->get_field_id('fontFamily')); ?>">
          <?php esc_html_e('Font Family', 'text_domain'); ?>
        </label>
        <input class="widefat" id="<?php echo esc_attr($this->get_field_id('fontFamily')); ?>"
               name="<?php echo esc_attr($this->get_field_name('fontFamily')); ?>" type="text"
               value="Open Sans, sans-serif" />
      </div>
    </p>

  <?php }

  // Update widget settings
  public function update($newInstance, $oldInstance)
  {
    $instance = $oldInstance;
    $instance['apikey'] = isset($newInstance['apikey']) ? wp_strip_all_tags($newInstance['apikey']) : '';
    $instance['containerMaxWidth'] = isset($newInstance['containerMaxWidth']) ? wp_strip_all_tags($newInstance['containerMaxWidth']) : '';
    $instance['landscapeMode'] = isset($newInstance['landscapeMode']) ? wp_strip_all_tags($newInstance['landscapeMode']) : '';
    $instance['showEquivalents'] = isset($newInstance['showEquivalents']) ? wp_strip_all_tags($newInstance['showEquivalents']) : '';
    $instance['applyLoadFactor'] = isset($newInstance['applyLoadFactor']) ? wp_strip_all_tags($newInstance['applyLoadFactor']) : '';
    $instance['primaryColor'] = isset($newInstance['primaryColor']) ?
      wp_strip_all_tags($newInstance['primaryColor']) : '';
    $instance['secondaryColor'] = isset($newInstance['secondaryColor']) ?
      wp_strip_all_tags($newInstance['secondaryColor']) : '';
    $instance['primaryBackgroundColor'] = isset($newInstance['primaryBackgroundColor']) ?
      wp_strip_all_tags($newInstance['primaryBackgroundColor']) : '';
    $instance['secondaryBackgroundColor'] = isset($newInstance['secondaryBackgroundColor']) ?
      wp_strip_all_tags($newInstance['secondaryBackgroundColor']) : '';
    $instance['selectedColor'] = isset($newInstance['selectedColor']) ?
      wp_strip_all_tags($newInstance['selectedColor']) : '';
    $instance['fontFamily'] = isset($newInstance['fontFamily']) ?
      wp_strip_all_tags($newInstance['fontFamily']) : '';
    return $instance;
  }

  // Display the widget
  public function widget($args, $instance)
  {

    extract($args);

    // Check the widget options
    $apikey = isset($instance['apikey']) ? $instance['apikey'] : '';
    $containerMaxWidth = isset($instance['containerMaxWidth']) ? $instance['containerMaxWidth'] : '';
    $landscapeMode = isset($instance['landscapeMode']) ? $instance['landscapeMode'] : '';
    $showEquivalents = isset($instance['showEquivalents']) ? $instance['showEquivalents'] : '';
    $applyLoadFactor = isset($instance['applyLoadFactor']) ? $instance['applyLoadFactor'] : '';
    $logoMode = 'logo-only';

    $primaryColor = isset($instance['primaryColor']) ? $instance['primaryColor'] : '';
    $secondaryColor = isset($instance['secondaryColor']) ? $instance['secondaryColor'] : '';
    $primaryBackgroundColor = isset($instance['primaryBackgroundColor']) ? $instance['primaryBackgroundColor'] : '';
    $secondaryBackgroundColor = isset($instance['secondaryBackgroundColor']) ?
      $instance['secondaryBackgroundColor'] : '';
    $selectedColor = isset($instance['selectedColor']) ? $instance['selectedColor'] : '';
    $fontFamily = isset($instance['fontFamily']) ? $instance['fontFamily'] : '';

    // WordPress core before_widget hook (always include )
    echo $before_widget;

    // Display the widget
    ?>
      <div class="widget-text wp_widget_plugin_box">
        <?php
        if($apikey === '') {
          ?>
              <div style='color: red'>
                <p>To use our widget, a valid API key is required.</p>
                <p>Contact our customer care team at support@pace-esg.com to receive your key and unlock the full potential of our tool.</p>
              </div>
          <?php
        }
        else {
          $landscapeModeCheck = wp_json_encode($landscapeMode === 'on');
          $showEquivalentsCheck = wp_json_encode($showEquivalents === 'on');
          $applyLoadFactorCheck = wp_json_encode($applyLoadFactor === 'on');
          $theme = array(
            'primaryColor' => esc_attr($primaryColor),
            'primaryBackgroundColor' => esc_attr($primaryBackgroundColor),
            'secondaryColor' => esc_attr($secondaryColor),
            'secondaryBackgroundColor' => esc_attr($secondaryBackgroundColor),
            'selectedColor' => esc_attr($selectedColor),
            'fontFamily' => esc_attr($fontFamily),
          );

            ?>
              <div style='width: 100%'>
                <pace-carboncalculator
                  apikey="<?php echo esc_attr($apikey)?>"
                  landscape-mode="<?php echo esc_attr($landscapeModeCheck)?>"
                  container-width="<?php echo esc_attr($containerMaxWidth)?>"
                  show-equivalents="<?php echo esc_attr($showEquivalentsCheck)?>"
                  apply-load-factor="<?php echo esc_attr($applyLoadFactorCheck)?>"
                  logo-mod="<?php echo esc_attr($logoMode)?>"
                  theme="<?php echo esc_attr(wp_json_encode($theme))?>">
                </pace-carboncalculator>
              </div>
            <?php
        }

        ?>
      </div>
    <?php

    // WordPress core after_widget hook, mandatory at the end of method
    echo $after_widget;
  }

}

// Register the widget
function co2footprint_register_widget()
{
  register_widget('Co2FootprintWidget');
}

add_action('widgets_init', 'co2footprint_register_widget');
