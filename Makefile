# * Variables

NAME := tabtint

TOP := $(shell pwd)
BUILD_DIR := $(TOP)/build

VERSION := $(shell sed -nr 's/.*em:version(>|=")(.*)["<].*/\2/p' $(TOP)/install.rdf | sed 1q)

XPI_NAME := $(NAME)-$(VERSION)
XPI_FILE := $(XPI_NAME).xpi
XPI_PATH := $(BUILD_DIR)/$(XPI_NAME:%.xpi=%)

XPI_FILES := chrome defaults chrome.manifest install.rdf README.org LICENSE

# * Functions

define clean
	rm -rf $(BUILD_DIR)
endef

# * Rules

TARGETS := clean xpi

.PHONY: $(TARGETS)

clean:
	$(call clean)

xpi: $(FILES)
	@echo "Building XPI..."

	# Delete and recreate build directories
	$(call clean)
	mkdir -p "$(XPI_PATH)"

	# Copy files to archive directory
	cp -a $(XPI_FILES) "$(XPI_PATH)"

	# Build archive
	cd "$(XPI_PATH)" && zip --no-dir-entries -9r "$(BUILD_DIR)"/"$(XPI_FILE)" *

	@echo "Built XPI: $(BUILD_DIR)/$(XPI_FILE)"
