// Shared Stylelint configuration — STD-00011 CSS rules
//
// Usage (consumer .stylelintrc.json):
//   { "extends": "@nullvariant/onsa-stylelint-config" }

/** @type {import("stylelint").Config} */
export default {
	extends: ["stylelint-config-standard"],
	rules: {
		// STD-00011 mandatory rules
		"no-duplicate-selectors": true,
		"color-no-invalid-hex": true,
		"declaration-block-no-duplicate-properties": true,
		"no-descending-specificity": true,
		"selector-pseudo-class-no-unknown": [
			true,
			{
				ignorePseudoClasses: ["global"],
			},
		],

		// Relaxations — disable overly opinionated stylelint-config-standard rules
		"custom-property-pattern": null,
		"selector-class-pattern": null,
		"declaration-empty-line-before": null,
		"rule-empty-line-before": null,
		"comment-empty-line-before": null,
		"no-empty-source": null,
	},
};
